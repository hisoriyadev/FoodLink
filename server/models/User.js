import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['donor', 'ngo', 'volunteer', 'admin'],
      default: 'donor',
    },
    organizationDetails: {
      name: String,
      registrationNumber: String,
      gstNumber: String,
      address: String,
      logo: String,
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    profilePicture: {
      type: String,
      default: '',
    },
    notificationSettings: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },
    // Volunteer-specific fields
    volunteerDetails: {
      vehicleType: {
        type: String,
        enum: ['Bicycle', 'Motorcycle', 'Car', 'Van', 'Truck', 'Walking', 'Other'],
      },
      vehicleNumber: String,
      licenseNumber: String,
      emergencyContactName: String,
      emergencyContactPhone: String,
      availability: {
        type: String,
        enum: ['available', 'busy', 'offline'],
        default: 'available',
      },
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  // Prevent double-hashing if password is already a bcrypt hash
  if (this.password && /^\$2[abxy]\$\d+\$/.test(this.password)) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
