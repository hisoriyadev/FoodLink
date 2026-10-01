import User from '../models/User.js';
import Donation from '../models/Donation.js';
import SystemSettings from '../models/SystemSettings.js';
import ActivityLog from '../models/ActivityLog.js';

// ==================== DASHBOARD STATS ====================

// @desc    Get admin dashboard stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalDonors,
      totalNGOs,
      totalVolunteers,
      totalDonations,
      pendingDonations,
      completedDonations,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'donor' }),
      User.countDocuments({ role: 'ngo' }),
      User.countDocuments({ role: 'volunteer' }),
      Donation.countDocuments(),
      Donation.countDocuments({ status: 'available' }),
      Donation.countDocuments({ status: 'delivered' }),
    ]);

    // Food saved and meals served from completed donations
    const completedDonationData = await Donation.find({ status: 'delivered' });
    const foodSavedKg = completedDonationData.reduce((acc, d) => {
      return acc + (d.unit === 'Kg' ? d.quantity : d.quantity * 0.5);
    }, 0);
    const mealsServed = completedDonationData.reduce((acc, d) => acc + d.peopleServed, 0);

    res.json({
      totalUsers,
      totalDonors,
      totalNGOs,
      totalVolunteers,
      totalDonations,
      pendingDonations,
      completedDonations,
      foodSavedKg: Math.round(foodSavedKg),
      mealsServed,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donations grouped by day for last 30 days (for chart)
// @route   GET /api/admin/stats/donations-chart
// @access  Private (Admin)
export const getDonationsChartData = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const data = await Donation.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(data.map(d => ({ date: d._id, donations: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donations grouped by category (for pie chart)
// @route   GET /api/admin/stats/categories-chart
// @access  Private (Admin)
export const getCategoryChartData = async (req, res) => {
  try {
    const data = await Donation.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
    res.json(data.map(d => ({ name: d._id, value: d.count })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== USER MANAGEMENT ====================

// @desc    Get all users with filters, search, pagination
// @route   GET /api/admin/users
// @access  Private (Admin)
export const getAllUsers = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.isActive = req.query.status === 'active';
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const total = await User.countDocuments(filter);

    res.json({ users, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const donationsCount = user.role === 'donor'
      ? await Donation.countDocuments({ donor: user._id })
      : 0;

    res.json({ ...user.toObject(), donationsCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user role and status
// @route   PUT /api/admin/users/:id
// @access  Private (Admin)
export const updateUser = async (req, res) => {
  try {
    const { role, isActive, name, phone } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (role !== undefined) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;

    await user.save();

    // Log activity
    await ActivityLog.create({
      actionType: isActive === false ? 'USER_SUSPENDED' : 'SETTINGS_UPDATED',
      description: `Admin updated user: ${user.name} (${user.email})`,
      performedBy: req.user._id,
      targetUser: user._id,
    });

    res.json({ message: 'User updated successfully', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ message: 'Cannot delete an admin user' });

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== DONATION MANAGEMENT ====================

// @desc    Get all donations (admin view)
// @route   GET /api/admin/donations
// @access  Private (Admin)
export const getAllDonations = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 15;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate('donor', 'name email organizationDetails')
      .populate('assignedTo.ngo', 'name email')
      .populate('assignedTo.volunteer', 'name email');

    const total = await Donation.countDocuments(filter);
    res.json({ donations, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin delete donation
// @route   DELETE /api/admin/donations/:id
// @access  Private (Admin)
export const adminDeleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findByIdAndDelete(req.params.id);
    if (!donation) return res.status(404).json({ message: 'Donation not found' });
    res.json({ message: 'Donation deleted by admin' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== SYSTEM SETTINGS ====================

// @desc    Get system settings
// @route   GET /api/admin/settings
// @access  Private (Admin)
export const getSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/admin/settings
// @access  Private (Admin)
export const updateSettings = async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) settings = new SystemSettings({});

    const fields = [
      'websiteName', 'contactEmail', 'contactPhone', 'address',
      'emailNotificationsEnabled', 'pushNotificationsEnabled',
      'aiPrioritizationEnabled', 'autoAssignVolunteers', 'themeMode',
    ];
    fields.forEach(f => { if (req.body[f] !== undefined) settings[f] = req.body[f]; });
    settings.updatedBy = req.user._id;

    await settings.save();

    await ActivityLog.create({
      actionType: 'SETTINGS_UPDATED',
      description: 'Admin updated system settings.',
      performedBy: req.user._id,
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==================== ACTIVITY LOGS / NOTIFICATIONS ====================

// @desc    Get recent activity logs (admin notifications)
// @route   GET /api/admin/notifications
// @access  Private (Admin)
export const getNotifications = async (req, res) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('performedBy', 'name')
      .populate('targetUser', 'name email');
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PATCH /api/admin/notifications/read-all
// @access  Private (Admin)
export const markAllNotificationsRead = async (req, res) => {
  try {
    await ActivityLog.updateMany({ isRead: false }, { isRead: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
