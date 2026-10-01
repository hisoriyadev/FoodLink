import Donation from '../models/Donation.js';
import cloudinary from '../utils/cloudinary.js';
import { sendDonationCreatedEmail } from '../utils/emailService.js';
import { notifyUser, notifyRole } from '../utils/socketService.js';

// Helper function to upload buffer to cloudinary
const streamUpload = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'foodlink_donations' },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
};

// @desc    Create new donation
// @route   POST /api/donations
// @access  Private (Donor only)
export const createDonation = async (req, res) => {
  try {
    let imageUrls = [];

    // If duplicating, existing images are sent in body
    if (req.body.existingImages) {
      try {
        imageUrls = JSON.parse(req.body.existingImages);
      } catch (e) {
        console.error('Failed to parse existing images:', e);
      }
    }

    // Handle image uploads if present
    if (req.files && req.files.length > 0) {
      if (process.env.CLOUDINARY_API_KEY) {
        for (const file of req.files) {
          const result = await streamUpload(file.buffer);
          imageUrls.push({
            url: result.secure_url,
            public_id: result.public_id,
          });
        }
      } else {
        // Mock upload for local testing
        imageUrls.push({
          url: 'https://via.placeholder.com/400?text=Donation+Image',
          public_id: 'mock_id_' + Date.now()
        });
      }
    }

    // Helper to safely parse JSON strings or return object as-is
    const safeParse = (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val || {};
    };

    // Parse JSON strings or objects
    const location = safeParse(req.body.location);
    const dietary = safeParse(req.body.dietary);
    const pickupWindow = safeParse(req.body.pickupWindow);

    const donation = new Donation({
      donor: req.user._id,
      title: req.body.title,
      category: req.body.category,
      mealType: req.body.mealType,
      quantity: Number(req.body.quantity),
      unit: req.body.unit,
      peopleServed: Number(req.body.peopleServed),
      description: req.body.description,
      preparationDate: new Date(req.body.preparationDate),
      expiryDate: new Date(req.body.expiryDate),
      pickupWindow,
      location,
      images: imageUrls,
      specialInstructions: req.body.specialInstructions || '',
      foodCondition: req.body.foodCondition,
      dietary,
      refrigerationRequired: req.body.refrigerationRequired === 'true',
      contactNumber: req.body.contactNumber,
    });

    const createdDonation = await donation.save();

    // Trigger Email to Donor
    sendDonationCreatedEmail(req.user, createdDonation).catch(err => console.error('Donation created email error:', err));

    // Trigger In-app Socket Notification to Donor
    notifyUser(req.user._id, {
      title: 'Donation Published',
      message: `Your food donation "${createdDonation.title}" is now active and available for NGOs.`,
      type: 'new_donation',
      relatedDonation: createdDonation._id,
    }).catch(err => console.error('Donor notification error:', err));

    // Trigger Real-time Socket Notification to All NGOs
    notifyRole('ngo', {
      title: 'New Available Donation',
      message: `New surplus food "${createdDonation.title}" (${createdDonation.quantity} ${createdDonation.unit}) posted in ${createdDonation.location?.city || 'your area'}.`,
      type: 'new_donation',
      relatedUser: req.user._id,
      relatedDonation: createdDonation._id,
    }).catch(err => console.error('NGO notification error:', err));

    res.status(201).json(createdDonation);
  } catch (error) {
    console.error('Donation creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user's donations
// @route   GET /api/donations/my
// @access  Private (Donor)
export const getMyDonations = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Filter by status if provided
    const filter = { donor: req.user._id };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Search by title if provided
    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    // Sort configuration
    let sortConfig = { createdAt: -1 };
    if (req.query.sort === 'expiryAsc') sortConfig = { expiryDate: 1 };
    if (req.query.sort === 'expiryDesc') sortConfig = { expiryDate: -1 };

    const donations = await Donation.find(filter)
      .sort(sortConfig)
      .limit(limit)
      .skip(skip)
      .populate('assignedTo.ngo', 'name email organizationDetails')
      .populate('assignedTo.volunteer', 'name email phone');

    const count = await Donation.countDocuments(filter);

    res.json({
      donations,
      page,
      pages: Math.ceil(count / limit),
      total: count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get donation by ID
// @route   GET /api/donations/:id
// @access  Private
export const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate('donor', 'name email phone organizationDetails')
      .populate('assignedTo.ngo', 'name email phone organizationDetails')
      .populate('assignedTo.volunteer', 'name email phone');

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Ensure donor can only view their own donation unless they are admin, or it's assigned to the ngo/volunteer
    if (
      req.user.role === 'donor' && 
      donation.donor._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to view this donation' });
    }

    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a donation
// @route   PUT /api/donations/:id
// @access  Private (Donor only)
export const updateDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify ownership
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this donation' });
    }

    // Can only edit if status is available
    if (donation.status !== 'available') {
      return res.status(400).json({ message: 'Cannot edit donation after it has been claimed' });
    }

    // Process new images if uploaded
    let newImageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await streamUpload(file.buffer);
        newImageUrls.push({
          url: result.secure_url,
          public_id: result.public_id,
        });
      }
    }

    // Handle existing images logic (keep them or replace them based on logic)
    // For simplicity, if new images are uploaded, we replace them. Otherwise, keep old.
    // A robust app would parse a list of images to delete from Cloudinary here.

    // Parse incoming JSON data safely
    const safeParse = (val) => {
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return val; }
      }
      return val;
    };
    if (req.body.location) req.body.location = safeParse(req.body.location);
    if (req.body.dietary) req.body.dietary = safeParse(req.body.dietary);
    if (req.body.pickupWindow) req.body.pickupWindow = safeParse(req.body.pickupWindow);

    // Update fields
    const fieldsToUpdate = [
      'title', 'category', 'mealType', 'quantity', 'unit', 'peopleServed',
      'description', 'preparationDate', 'expiryDate', 'pickupWindow',
      'location', 'specialInstructions', 'foodCondition', 'dietary',
      'refrigerationRequired', 'contactNumber'
    ];

    fieldsToUpdate.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'refrigerationRequired') {
           donation[field] = req.body[field] === 'true';
        } else {
           donation[field] = req.body[field];
        }
      }
    });

    if (newImageUrls.length > 0) {
      donation.images = newImageUrls;
    }

    const updatedDonation = await donation.save();
    res.json(updatedDonation);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a donation
// @route   DELETE /api/donations/:id
// @access  Private (Donor only)
export const deleteDonation = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Verify ownership
    if (donation.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this donation' });
    }

    // Delete images from Cloudinary
    if (donation.images && donation.images.length > 0) {
      for (const img of donation.images) {
        if (img.public_id) {
          await cloudinary.uploader.destroy(img.public_id);
        }
      }
    }

    await donation.deleteOne();
    res.json({ message: 'Donation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update donation status
// @route   PATCH /api/donations/:id/status
// @access  Private
export const updateDonationStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const donation = await Donation.findById(req.params.id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    // Push new status to history
    donation.status = status;
    donation.statusHistory.push({
      status,
      note: note || '',
      updatedBy: req.user._id,
      timestamp: Date.now()
    });

    await donation.save();
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard stats for donor
// @route   GET /api/donations/stats/donor
// @access  Private (Donor)
export const getDonorStats = async (req, res) => {
  try {
    const donations = await Donation.find({ donor: req.user._id });

    const stats = {
      totalDonations: donations.length,
      activeDonations: donations.filter(d => ['available', 'claimed'].includes(d.status)).length,
      completedDonations: donations.filter(d => d.status === 'delivered').length,
      foodSavedKg: donations
        .filter(d => d.status === 'delivered')
        .reduce((acc, d) => acc + (d.unit === 'Kg' ? d.quantity : d.quantity * 0.5), 0), // Assuming 1 meal/packet is roughly 0.5kg for demo
      peopleServed: donations
        .filter(d => d.status === 'delivered')
        .reduce((acc, d) => acc + d.peopleServed, 0)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all available donations (for NGOs/Volunteers)
// @route   GET /api/donations
// @access  Private
export const getDonations = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { status: 'available' };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.city) {
      filter['location.city'] = { $regex: req.query.city, $options: 'i' };
    }

    if (req.query.search) {
      filter.title = { $regex: req.query.search, $options: 'i' };
    }

    const donations = await Donation.find(filter)
      .sort({ createdAt: -1 })
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

// @desc    Get completed/past donations history for current user
// @route   GET /api/donations/history
// @access  Private
export const getDonationsHistory = async (req, res) => {
  try {
    const filter = {};
    
    // If donor, return their completed donations. If NGO or Volunteer, return theirs.
    if (req.user.role === 'donor') {
      filter.donor = req.user._id;
    } else if (req.user.role === 'ngo') {
      filter['assignedTo.ngo'] = req.user._id;
    } else if (req.user.role === 'volunteer') {
      filter['assignedTo.volunteer'] = req.user._id;
    }

    // History includes delivered, cancelled, or expired donations
    filter.status = { $in: ['delivered', 'cancelled', 'expired'] };

    const donations = await Donation.find(filter)
      .sort({ updatedAt: -1 })
      .populate('donor', 'name email phone organizationDetails')
      .populate('assignedTo.ngo', 'name email phone')
      .populate('assignedTo.volunteer', 'name email phone');

    res.json(donations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update donation status (ID passed in body)
// @route   PATCH /api/donations/status
// @access  Private
export const updateDonationStatusBody = async (req, res) => {
  try {
    const { id, status, note } = req.body;
    if (!id || !status) {
      return res.status(400).json({ message: 'Donation ID and status are required' });
    }

    const donation = await Donation.findById(id);

    if (!donation) {
      return res.status(404).json({ message: 'Donation not found' });
    }

    donation.status = status;
    donation.statusHistory.push({
      status,
      note: note || '',
      updatedBy: req.user._id,
      timestamp: Date.now()
    });

    await donation.save();
    res.json(donation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
