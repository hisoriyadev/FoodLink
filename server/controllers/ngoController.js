import Donation from '../models/Donation.js';
import User from '../models/User.js';
import ActivityLog from '../models/ActivityLog.js';
import { sendDonationAcceptedEmail, sendVolunteerAssignedEmail } from '../utils/emailService.js';
import { notifyUser, emitDonationStatusUpdate } from '../utils/socketService.js';

// @desc    Get NGO Dashboard statistics
// @route   GET /api/ngo/dashboard
// @access  Private (NGO only)
export const getNgoDashboard = async (req, res) => {
  try {
    const ngoId = req.user._id;

    const [
      availableDonations,
      acceptedDonations,
      completedDeliveries,
      pendingPickups,
    ] = await Promise.all([
      Donation.countDocuments({ status: 'available' }),
      Donation.countDocuments({ 'assignedTo.ngo': ngoId, status: { $in: ['claimed', 'picked_up'] } }),
      Donation.countDocuments({ 'assignedTo.ngo': ngoId, status: 'delivered' }),
      Donation.countDocuments({ 'assignedTo.ngo': ngoId, status: 'claimed' }),
    ]);

    // Calculate total meals received
    const completedDonationsList = await Donation.find({
      'assignedTo.ngo': ngoId,
      status: 'delivered',
    });
    
    const totalMealsReceived = completedDonationsList.reduce(
      (acc, curr) => acc + (curr.peopleServed || 0), 
      0
    );

    // Active volunteers count (unique volunteers assigned to active/completed NGO deliveries)
    const activeVolunteersCountList = await Donation.distinct('assignedTo.volunteer', {
      'assignedTo.ngo': ngoId,
      'assignedTo.volunteer': { $ne: null }
    });
    const activeVolunteers = activeVolunteersCountList.length;

    // Recent requests
    const recentRequests = await Donation.find({
      'assignedTo.ngo': ngoId,
      status: { $in: ['claimed', 'picked_up', 'delivered'] }
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('donor', 'name email phone')
      .populate('assignedTo.volunteer', 'name phone');

    res.json({
      stats: {
        availableDonations,
        acceptedDonations,
        completedDeliveries,
        pendingPickups,
        totalMealsReceived,
        activeVolunteers
      },
      recentRequests
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all available donations for NGOs
// @route   GET /api/ngo/donations
// @access  Private (NGO only)
export const getNgoDonations = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { status: 'available' };

    // Filter by Category
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Filter by Expiry
    if (req.query.expiryTime) {
      const now = new Date();
      if (req.query.expiryTime === 'soon') {
        const soon = new Date();
        soon.setHours(soon.getHours() + 6);
        filter.expiryDate = { $gte: now, $lte: soon };
      } else {
        filter.expiryDate = { $gte: now };
      }
    }

    // Filter by Quantity
    if (req.query.quantity) {
      const qty = Number(req.query.quantity);
      filter.peopleServed = { $gte: qty };
    }

    // Search query
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    // Sort configurations
    let sortConfig = { createdAt: -1 };
    if (req.query.sort === 'expiryAsc') sortConfig = { expiryDate: 1 };
    if (req.query.sort === 'quantityDesc') sortConfig = { peopleServed: -1 };

    const donations = await Donation.find(filter)
      .sort(sortConfig)
      .limit(limit)
      .skip(skip)
      .populate('donor', 'name email phone organizationDetails');

    const count = await Donation.countDocuments(filter);

    res.json({
      donations,
      page,
      pages: Math.ceil(count / limit),
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single donation detail
// @route   GET /api/ngo/donations/:id
// @access  Private (NGO only)
export const getNgoDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone organizationDetails')
      .populate('assignedTo.ngo', 'name email phone organizationDetails')
      .populate('assignedTo.volunteer', 'name email phone');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept/Claim available donation
// @route   POST /api/ngo/accept
// @access  Private (NGO only)
export const acceptDonation = async (req, res) => {
  try {
    const { donationId } = req.body;
    if (!donationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Donation is no longer available' });
    }

    // Accept donation
    donation.status = 'claimed';
    donation.assignedTo.ngo = req.user._id;
    donation.statusHistory.push({
      status: 'claimed',
      note: 'Donation claimed by NGO',
      updatedBy: req.user._id,
      timestamp: Date.now()
    });

    await donation.save();

    // Trigger Email & Notification to Donor
    const donor = await User.findById(donation.donor);
    if (donor) {
      sendDonationAcceptedEmail(donor, req.user, donation).catch(err => console.error('Accept email error:', err));
      notifyUser(donor._id, {
        title: 'Donation Accepted',
        message: `${req.user.organizationDetails?.name || req.user.name} has accepted your donation "${donation.title}".`,
        type: 'donation_accepted',
        relatedUser: req.user._id,
        relatedDonation: donation._id,
      }).catch(err => console.error('Donor socket notification error:', err));
    }

    emitDonationStatusUpdate(donation._id, donation);

    // Log Activity
    await ActivityLog.create({
      actionType: 'NGO_APPROVED', // reusing compatible existing type
      description: `${req.user.name} (NGO) claimed donation: ${donation.title}`,
      performedBy: req.user._id,
      targetDonation: donation._id
    });

    res.json({ message: 'Donation claimed successfully', donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request volunteer assignment for claimed donation
// @route   POST /api/ngo/request-volunteer
// @access  Private (NGO only)
export const requestVolunteer = async (req, res) => {
  try {
    const { donationId, volunteerId } = req.body;
    if (!donationId) {
      return res.status(400).json({ message: 'Donation ID is required' });
    }

    const donation = await Donation.findById(donationId);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    if (donation.assignedTo.ngo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to request volunteer for this donation' });
    }

    // Assign volunteer if id provided, or set request flag
    if (volunteerId) {
      donation.assignedTo.volunteer = volunteerId;
      donation.statusHistory.push({
        status: donation.status,
        note: `Volunteer assigned by NGO`,
        updatedBy: req.user._id,
        timestamp: Date.now()
      });
    }

    await donation.save();
    res.json({ message: 'Volunteer update successful', donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get completed request history for NGO
// @route   GET /api/ngo/history
// @access  Private (NGO only)
export const getNgoHistory = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const filter = {
      'assignedTo.ngo': ngoId,
      status: { $in: ['delivered', 'cancelled', 'expired'] }
    };

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const donations = await Donation.find(filter)
      .sort({ updatedAt: -1 })
      .populate('donor', 'name email phone organizationDetails')
      .populate('assignedTo.volunteer', 'name email phone');

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update NGO Profile
// @route   PUT /api/ngo/profile
// @access  Private (NGO only)
export const updateNgoProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'NGO not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;

    if (req.body.organizationDetails) {
      user.organizationDetails = {
        name: req.body.organizationDetails.name || user.organizationDetails?.name || '',
        registrationNumber: req.body.organizationDetails.registrationNumber || user.organizationDetails?.registrationNumber || '',
        gstNumber: req.body.organizationDetails.gstNumber || user.organizationDetails?.gstNumber || '',
        address: req.body.organizationDetails.address || user.organizationDetails?.address || '',
        logo: req.body.organizationDetails.logo || user.organizationDetails?.logo || '',
        website: req.body.organizationDetails.website || '',
        description: req.body.organizationDetails.description || '',
        operatingHours: req.body.organizationDetails.operatingHours || '',
      };
    }

    if (req.body.notificationSettings) {
      user.notificationSettings = {
        email: req.body.notificationSettings.email !== undefined ? req.body.notificationSettings.email : user.notificationSettings?.email,
        push: req.body.notificationSettings.push !== undefined ? req.body.notificationSettings.push : user.notificationSettings?.push,
      };
    }

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get volunteers list for assignment
// @route   GET /api/ngo/volunteers
// @access  Private (NGO only)
export const getVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: 'volunteer' }).select('-password');
    
    // For each volunteer, aggregate their active and completed donations
    const volunteerData = await Promise.all(
      volunteers.map(async (v) => {
        const [activeCount, completedCount] = await Promise.all([
          Donation.countDocuments({ 'assignedTo.volunteer': v._id, status: { $in: ['claimed', 'picked_up'] } }),
          Donation.countDocuments({ 'assignedTo.volunteer': v._id, status: 'delivered' })
        ]);
        return {
          _id: v._id,
          name: v.name,
          email: v.email,
          phone: v.phone,
          profilePicture: v.profilePicture,
          status: activeCount > 0 ? 'busy' : 'available',
          activeDeliveries: activeCount,
          completedDeliveries: completedCount
        };
      })
    );

    res.json(volunteerData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get report analytics for NGO
// @route   GET /api/ngo/reports
// @access  Private (NGO only)
export const getNgoReports = async (req, res) => {
  try {
    const ngoId = req.user._id;

    // Fetch all donations received by this NGO (claimed, picked_up, delivered)
    const donations = await Donation.find({ 'assignedTo.ngo': ngoId })
      .populate('donor', 'name')
      .populate('assignedTo.volunteer', 'name');

    // 1. Monthly Statistics (past 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyStatsMap = {};
    
    // Initialize past 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()] + ' ' + d.getFullYear().toString().slice(-2);
      monthlyStatsMap[mName] = { month: mName, donations: 0, meals: 0 };
    }

    // 2. Food Categories Distribution
    const categoryMap = { Cooked: 0, Raw: 0, Packaged: 0, Beverages: 0, Baked: 0, Other: 0 };

    // 3. Volunteer Performance
    const volunteerPerformanceMap = {};

    donations.forEach(donation => {
      // Monthly mapping
      const date = new Date(donation.createdAt);
      const mName = months[date.getMonth()] + ' ' + date.getFullYear().toString().slice(-2);
      if (monthlyStatsMap[mName]) {
        monthlyStatsMap[mName].donations += 1;
        if (donation.status === 'delivered') {
          monthlyStatsMap[mName].meals += donation.peopleServed || 0;
        }
      }

      // Category mapping
      if (categoryMap[donation.category] !== undefined) {
        categoryMap[donation.category] += 1;
      } else {
        categoryMap['Other'] += 1;
      }

      // Volunteer mapping
      if (donation.assignedTo.volunteer && donation.status === 'delivered') {
        const vName = donation.assignedTo.volunteer.name;
        if (!volunteerPerformanceMap[vName]) {
          volunteerPerformanceMap[vName] = { name: vName, deliveries: 0, meals: 0 };
        }
        volunteerPerformanceMap[vName].deliveries += 1;
        volunteerPerformanceMap[vName].meals += donation.peopleServed || 0;
      }
    });

    const monthlyStats = Object.values(monthlyStatsMap);
    
    const categoryData = Object.keys(categoryMap).map(k => ({
      name: k,
      value: categoryMap[k]
    })).filter(item => item.value > 0);

    const volunteerPerformance = Object.values(volunteerPerformanceMap)
      .sort((a, b) => b.deliveries - a.deliveries)
      .slice(0, 5); // top 5 volunteers

    // 4. Distribution trends (delivered vs cancelled vs expired)
    const trends = {
      delivered: donations.filter(d => d.status === 'delivered').length,
      cancelled: donations.filter(d => d.status === 'cancelled').length,
      expired: donations.filter(d => d.status === 'expired').length,
      active: donations.filter(d => ['claimed', 'picked_up'].includes(d.status)).length,
    };

    res.json({
      monthlyStats,
      categoryData,
      volunteerPerformance,
      trends
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active claims for NGO
// @route   GET /api/ngo/claims
// @access  Private (NGO only)
export const getNgoClaims = async (req, res) => {
  try {
    const claims = await Donation.find({
      'assignedTo.ngo': req.user._id,
      status: { $in: ['claimed', 'picked_up'] }
    })
      .sort({ updatedAt: -1 })
      .populate('donor', 'name email phone organizationDetails')
      .populate('assignedTo.volunteer', 'name email phone');

    res.json(claims);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
