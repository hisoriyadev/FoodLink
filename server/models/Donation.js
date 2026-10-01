import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'available',
      'claimed',
      'assigned',
      'on_way_to_pickup',
      'picked_up',
      'on_way_to_ngo',
      'delivered',
      'expired',
      'cancelled'
    ],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  note: String,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { _id: false });

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['Cooked', 'Raw', 'Packaged', 'Beverages', 'Baked', 'Other'],
    },
    mealType: {
      type: String,
      required: true,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Any'],
    },
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
      enum: ['Kg', 'Packets', 'Meals', 'Liters', 'Pieces'],
    },
    peopleServed: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    preparationDate: {
      type: Date,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    pickupWindow: {
      start: { type: Date, required: true },
      end: { type: Date, required: true }
    },
    location: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    images: [{
      url: String,
      public_id: String
    }],
    specialInstructions: String,
    foodCondition: {
      type: String,
      enum: ['Fresh', 'Leftover', 'Packaged Unopened'],
      required: true
    },
    dietary: {
      isVeg: { type: Boolean, required: true },
      allergens: [String],
    },
    refrigerationRequired: {
      type: Boolean,
      default: false
    },
    contactNumber: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['available', 'claimed', 'picked_up', 'delivered', 'expired', 'cancelled'],
      default: 'available',
    },
    statusHistory: [statusHistorySchema],
    assignedTo: {
      ngo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      volunteer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    // AI & Smart Automation Fields
    freshnessScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    priorityScore: {
      type: Number,
      default: 0,
    },
    recommendationScore: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true,
  }
);

// Middleware to push initial status history on creation
donationSchema.pre('save', function() {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory.push({
      status: this.status,
      timestamp: Date.now(),
      updatedBy: this.donor
    });
  }
});

const Donation = mongoose.model('Donation', donationSchema);
export default Donation;
