import Donation from '../models/Donation.js';
import User from '../models/User.js';
import Rating from '../models/Rating.js';
import ActivityLog from '../models/ActivityLog.js';
import bcrypt from 'bcryptjs';
import { sendDeliveryCompletedEmail } from '../utils/emailService.js';
import { notifyUser, emitDonationStatusUpdate } from '../utils/socketService.js';

// ─── HELPER ───────────────────────────────────────────────────────────────────
const VOLUNTEER_STATUSES = ['on_way_to_pickup', 'picked_up', 'on_way_to_ngo', 'delivered'];

const volunteerStatusTransitions = {
  claimed:         'on_way_to_pickup',
  on_way_to_pickup:'picked_up',
  picked_up:       'on_way_to_ngo',
  on_way_to_ngo:   'delivered',
};

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
// @route   GET /api/volunteer/dashboard
// @access  Private (volunteer)
export const getVolunteerDashboard = async (req, res) => {
  try {
    const volunteerId = req.user._id;

    const [assigned, active, completed, totalMealsAgg, ratingAgg] = await Promise.all([
      // Assigned (not yet started)
      Donation.countDocuments({
        'assignedTo.volunteer': volunteerId,
        volunteerStatus: 'claimed',
      }),
      // Active (in transit)
      Donation.countDocuments({
        'assignedTo.volunteer': volunteerId,
        volunteerStatus: { $in: ['on_way_to_pickup', 'picked_up', 'on_way_to_ngo'] },
      }),
      // Completed
      Donation.countDocuments({
        'assignedTo.volunteer': volunteerId,
        volunteerStatus: 'delivered',
      }),
      // Total meals
      Donation.aggregate([
        { $match: { 'assignedTo.volunteer': volunteerId, volunteerStatus: 'delivered' } },
        { $group: { _id: null, total: { $sum: '$peopleServed' } } },
      ]),
      // Average rating
      Rating.aggregate([
        { $match: { volunteer: volunteerId } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ]);

    const activeTasks = await Donation.find({
      'assignedTo.volunteer': volunteerId,
      volunteerStatus: { $in: ['claimed', 'on_way_to_pickup', 'picked_up', 'on_way_to_ngo'] },
    })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('donor', 'name phone')
      .populate('assignedTo.ngo', 'name phone organizationDetails');

    res.json({
      stats: {
        assignedCount: assigned,
        activeCount: active,
        completedCount: completed,
        totalMealsDelivered: totalMealsAgg[0]?.total || 0,
        averageRating: ratingAgg[0]?.avg ? parseFloat(ratingAgg[0].avg.toFixed(1)) : null,
        ratingCount: ratingAgg[0]?.count || 0,
      },
      activeTasks,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── MY ASSIGNMENTS ────────────────────────────────────────────────────────────
// @route   GET /api/volunteer/assignments
// @access  Private (volunteer)
export const getAssignments = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    const { search, status, sort = '-updatedAt', page = 1, limit = 10 } = req.query;

    const query = {
      'assignedTo.volunteer': volunteerId,
      volunteerStatus: { $in: ['claimed', 'on_way_to_pickup', 'picked_up', 'on_way_to_ngo'] },
    };

    if (status && status !== 'all') query.volunteerStatus = status;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Donation.countDocuments(query);

    const assignments = await Donation.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('donor', 'name email phone profilePicture organizationDetails')
      .populate('assignedTo.ngo', 'name email phone organizationDetails');

    res.json({
      assignments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/volunteer/assignments/:id
// @access  Private (volunteer)
export const getAssignmentById = async (req, res) => {
  try {
    const donation = await Donation.findOne({
      _id: req.params.id,
      'assignedTo.volunteer': req.user._id,
    })
      .populate('donor', 'name email phone profilePicture address organizationDetails')
      .populate('assignedTo.ngo', 'name email phone organizationDetails')
      .populate('statusHistory.updatedBy', 'name role');

    if (!donation) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Fetch volunteer's own rating for this donation (if submitted)
    const existingRating = await Rating.findOne({
      donation: req.params.id,
      ratedBy: req.user._id,
    });

    res.json({ assignment: donation, myFeedback: existingRating });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── DELIVERY STATUS PROGRESSION ──────────────────────────────────────────────
const _updateVolunteerStatus = async (req, res, targetStatus, logAction, noteDefault) => {
  try {
    const { donationId, note, location } = req.body;
    if (!donationId) return res.status(400).json({ message: 'Donation ID is required' });

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });

    if (!donation.assignedTo?.volunteer || donation.assignedTo.volunteer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized for this delivery' });
    }

    donation.volunteerStatus = targetStatus;

    // Mirror status on main field for NGO / Donor visibility
    if (targetStatus === 'picked_up' || targetStatus === 'delivered') {
      donation.status = targetStatus;
    }

    donation.statusHistory.push({
      status: targetStatus,
      note: note || noteDefault,
      updatedBy: req.user._id,
      timestamp: Date.now(),
    });

    if (location) {
      donation.lastKnownLocation = location;
    }

    await donation.save();

    // Trigger real-time status update for tracking
    emitDonationStatusUpdate(donation._id, donation);

    // Notify Donor & NGO via Socket & Email
    const donorId = donation.donor;
    const ngoId = donation.assignedTo?.ngo;

    const notifTitles = {
      on_way_to_pickup: 'Pickup Started',
      picked_up: 'Food Picked Up',
      on_way_to_ngo: 'In Transit to NGO',
      delivered: 'Delivery Completed',
    };

    const notifTypeMap = {
      on_way_to_pickup: 'pickup_started',
      picked_up: 'food_picked_up',
      on_way_to_ngo: 'pickup_started',
      delivered: 'delivery_completed',
    };

    const notifTitle = notifTitles[targetStatus] || 'Status Update';
    const notifType = notifTypeMap[targetStatus] || 'system';

    if (donorId) {
      notifyUser(donorId, {
        title: notifTitle,
        message: `Status update for "${donation.title}": ${noteDefault}`,
        type: notifType,
        relatedUser: req.user._id,
        relatedDonation: donation._id,
      }).catch(err => console.error('Donor status notification error:', err));
    }

    if (ngoId) {
      notifyUser(ngoId, {
        title: notifTitle,
        message: `Status update for "${donation.title}": ${noteDefault}`,
        type: notifType,
        relatedUser: req.user._id,
        relatedDonation: donation._id,
      }).catch(err => console.error('NGO status notification error:', err));
    }

    // On Delivery Completed -> Send Emails
    if (targetStatus === 'delivered') {
      const [donor, ngo] = await Promise.all([
        User.findById(donorId),
        User.findById(ngoId),
      ]);
      if (donor) sendDeliveryCompletedEmail(donor, donation, true).catch(err => console.error('Donor completed email error:', err));
      if (ngo) sendDeliveryCompletedEmail(ngo, donation, false).catch(err => console.error('NGO completed email error:', err));
    }

    await ActivityLog.create({
      actionType: logAction,
      description: `${req.user.name}: ${noteDefault} — "${donation.title}"`,
      performedBy: req.user._id,
      targetDonation: donation._id,
    });

    res.json({ message: 'Status updated', donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PATCH /api/volunteer/start-pickup
export const startPickup = (req, res) =>
  _updateVolunteerStatus(req, res, 'on_way_to_pickup', 'DELIVERY_STARTED', 'Volunteer is on the way to pickup location');

// @route   PATCH /api/volunteer/picked-up
export const markPickedUp = (req, res) =>
  _updateVolunteerStatus(req, res, 'picked_up', 'DONATION_PICKED_UP', 'Food picked up from donor');

// @route   PATCH /api/volunteer/on-way-to-ngo
export const startDelivery = (req, res) =>
  _updateVolunteerStatus(req, res, 'on_way_to_ngo', 'DELIVERY_STARTED', 'Volunteer is on the way to NGO');

// @route   PATCH /api/volunteer/delivered
export const markDelivered = (req, res) =>
  _updateVolunteerStatus(req, res, 'delivered', 'DONATION_DELIVERED', 'Food delivered to NGO successfully');

// ─── CLAIM TASK ────────────────────────────────────────────────────────────────
// @route   GET /api/volunteer/tasks
export const getPendingTasks = async (req, res) => {
  try {
    const { search, foodType, page = 1, limit = 12 } = req.query;

    const query = {
      status: 'claimed',
      'assignedTo.ngo': { $ne: null },
      'assignedTo.volunteer': null,
    };

    if (foodType && foodType !== 'all') query.foodType = foodType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Donation.countDocuments(query);

    const tasks = await Donation.find(query)
      .sort({ expiresAt: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('donor', 'name email phone organizationDetails')
      .populate('assignedTo.ngo', 'name email phone organizationDetails');

    res.json({ tasks, pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   POST /api/volunteer/accept-task
export const claimTask = async (req, res) => {
  try {
    const { donationId } = req.body;
    if (!donationId) return res.status(400).json({ message: 'Donation ID is required' });

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    if (donation.status !== 'claimed') return res.status(400).json({ message: 'This donation is not available for pickup' });
    if (donation.assignedTo.volunteer) return res.status(400).json({ message: 'A volunteer is already assigned' });

    donation.assignedTo.volunteer = req.user._id;
    donation.volunteerStatus = 'claimed';
    donation.statusHistory.push({
      status: 'claimed',
      note: `Delivery accepted by volunteer: ${req.user.name}`,
      updatedBy: req.user._id,
      timestamp: Date.now(),
    });

    await donation.save();

    await ActivityLog.create({
      actionType: 'VOLUNTEER_ASSIGNED',
      description: `${req.user.name} accepted delivery for: ${donation.title}`,
      performedBy: req.user._id,
      targetDonation: donation._id,
    });

    res.json({ message: 'Task accepted successfully', donation });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── HISTORY ───────────────────────────────────────────────────────────────────
// @route   GET /api/volunteer/history
export const getVolunteerHistory = async (req, res) => {
  try {
    const volunteerId = req.user._id;
    const { search, month, year, page = 1, limit = 10 } = req.query;

    const query = { 'assignedTo.volunteer': volunteerId, volunteerStatus: 'delivered' };

    if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 1);
      query.updatedAt = { $gte: start, $lt: end };
    } else if (year) {
      const start = new Date(parseInt(year), 0, 1);
      const end = new Date(parseInt(year) + 1, 0, 1);
      query.updatedAt = { $gte: start, $lt: end };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Donation.countDocuments(query);

    const history = await Donation.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('donor', 'name phone')
      .populate('assignedTo.ngo', 'name phone organizationDetails');

    // Monthly summary aggregation
    const monthlySummary = await Donation.aggregate([
      { $match: { 'assignedTo.volunteer': volunteerId, volunteerStatus: 'delivered' } },
      {
        $group: {
          _id: { year: { $year: '$updatedAt' }, month: { $month: '$updatedAt' } },
          count: { $sum: 1 },
          meals: { $sum: '$peopleServed' },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 },
    ]);

    res.json({
      history,
      monthlySummary,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── PROFILE ───────────────────────────────────────────────────────────────────
// @route   PUT /api/volunteer/profile
export const updateVolunteerProfile = async (req, res) => {
  try {
    const {
      name, phone, address,
      vehicleType, vehicleNumber, licenseNumber,
      emergencyContactName, emergencyContactPhone,
      availability, notificationSettings,
      currentPassword, newPassword,
    } = req.body;

    const user = await User.findById(req.user._id).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Password change
    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ message: 'Current password is required' });
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });
      user.password = newPassword;
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address) user.address = address;
    if (notificationSettings) user.notificationSettings = { ...user.notificationSettings, ...notificationSettings };

    // Volunteer details
    if (!user.volunteerDetails) user.volunteerDetails = {};
    if (vehicleType) user.volunteerDetails.vehicleType = vehicleType;
    if (vehicleNumber !== undefined) user.volunteerDetails.vehicleNumber = vehicleNumber;
    if (licenseNumber !== undefined) user.volunteerDetails.licenseNumber = licenseNumber;
    if (emergencyContactName !== undefined) user.volunteerDetails.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone !== undefined) user.volunteerDetails.emergencyContactPhone = emergencyContactPhone;
    if (availability) user.volunteerDetails.availability = availability;

    await user.save();

    await ActivityLog.create({
      actionType: 'PROFILE_UPDATED',
      description: `${user.name} updated their volunteer profile`,
      performedBy: user._id,
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        profilePicture: user.profilePicture,
        notificationSettings: user.notificationSettings,
        volunteerDetails: user.volunteerDetails,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── RATINGS & FEEDBACK ────────────────────────────────────────────────────────
// @route   POST /api/volunteer/feedback
export const submitFeedback = async (req, res) => {
  try {
    const { donationId, volunteerFeedback } = req.body;
    if (!donationId || !volunteerFeedback) {
      return res.status(400).json({ message: 'Donation ID and feedback are required' });
    }

    const donation = await Donation.findOne({
      _id: donationId,
      'assignedTo.volunteer': req.user._id,
      volunteerStatus: 'delivered',
    });

    if (!donation) {
      return res.status(404).json({ message: 'Delivered assignment not found' });
    }

    // Upsert — one feedback per donation per volunteer
    const feedback = await Rating.findOneAndUpdate(
      { donation: donationId, ratedBy: req.user._id },
      {
        volunteer: req.user._id,
        ratedBy: req.user._id,
        raterRole: 'ngo', // placeholder; volunteer submitting own feedback
        volunteerFeedback,
        donation: donationId,
        rating: req.body.rating || 5,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await ActivityLog.create({
      actionType: 'FEEDBACK_SUBMITTED',
      description: `${req.user.name} submitted feedback for delivery: ${donation.title}`,
      performedBy: req.user._id,
      targetDonation: donation._id,
    });

    res.json({ message: 'Feedback submitted', feedback });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   GET /api/volunteer/ratings
export const getMyRatings = async (req, res) => {
  try {
    const ratings = await Rating.find({ volunteer: req.user._id })
      .populate('ratedBy', 'name role organizationDetails')
      .populate('donation', 'title')
      .sort({ createdAt: -1 });

    const avg = ratings.length
      ? parseFloat((ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1))
      : null;

    res.json({ ratings, averageRating: avg, totalRatings: ratings.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route   PATCH /api/volunteer/availability
export const updateAvailability = async (req, res) => {
  try {
    const { availability } = req.body;
    if (!['available', 'busy', 'offline'].includes(availability)) {
      return res.status(400).json({ message: 'Invalid availability status' });
    }

    await User.findByIdAndUpdate(req.user._id, {
      'volunteerDetails.availability': availability,
    });

    res.json({ message: 'Availability updated', availability });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
