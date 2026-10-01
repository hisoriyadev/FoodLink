import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import cloudinary from '../utils/cloudinary.js';
import { sendRegistrationSuccessEmail } from '../utils/emailService.js';
import { notifyRole } from '../utils/socketService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, organizationDetails, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      organizationDetails,
      phone
    });

    if (user) {
      // Trigger Welcome Email
      sendRegistrationSuccessEmail(user).catch(err => console.error('Registration email error:', err));

      // Trigger Real-time Admin Notification
      notifyRole('admin', {
        title: 'New User Registered',
        message: `${user.name} (${user.email}) registered as a ${user.role.toUpperCase()}.`,
        type: 'system',
        relatedUser: user._id,
      }).catch(err => console.error('Admin notification error:', err));

      generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email ? email.trim().toLowerCase() : '';

    const user = await User.findOne({ email: cleanEmail }).select('+password');

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logoutUser = (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('jwt', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        organizationDetails: user.organizationDetails,
        profilePicture: user.profilePicture,
        notificationSettings: user.notificationSettings,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper function to upload profile picture buffer to cloudinary
const streamUploadProfile = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'foodlink_profiles' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.phone = req.body.phone || user.phone;

      // Handle file upload for profile picture
      if (req.file) {
        const result = await streamUploadProfile(req.file.buffer);
        user.profilePicture = result.secure_url;
      } else if (req.body.profilePicture !== undefined) {
        user.profilePicture = req.body.profilePicture;
      }

      // Handle organization details
      if (req.body.organizationDetails) {
        let orgDetails = {};
        try {
          orgDetails = typeof req.body.organizationDetails === 'string'
            ? JSON.parse(req.body.organizationDetails)
            : req.body.organizationDetails;
        } catch (e) {
          orgDetails = req.body.organizationDetails;
        }

        user.organizationDetails = {
          name: orgDetails.name || user.organizationDetails?.name || '',
          registrationNumber: orgDetails.registrationNumber || user.organizationDetails?.registrationNumber || '',
          gstNumber: orgDetails.gstNumber || user.organizationDetails?.gstNumber || '',
          address: orgDetails.address || user.organizationDetails?.address || '',
          logo: orgDetails.logo || user.organizationDetails?.logo || '',
        };
      }

      // Handle notification settings
      if (req.body.notificationSettings) {
        let notifSettings = {};
        try {
          notifSettings = typeof req.body.notificationSettings === 'string'
            ? JSON.parse(req.body.notificationSettings)
            : req.body.notificationSettings;
        } catch (e) {
          notifSettings = req.body.notificationSettings;
        }

        user.notificationSettings = {
          email: notifSettings.email !== undefined ? notifSettings.email : user.notificationSettings?.email,
          push: notifSettings.push !== undefined ? notifSettings.push : user.notificationSettings?.push,
        };
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        organizationDetails: updatedUser.organizationDetails,
        profilePicture: updatedUser.profilePicture,
        notificationSettings: updatedUser.notificationSettings,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change user password
// @route   PUT /api/auth/password
// @access  Private
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Please provide current and new passwords' });
    }

    const user = await User.findById(req.user._id).select('+password');

    if (user && (await user.matchPassword(currentPassword))) {
      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(401).json({ message: 'Invalid current password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
