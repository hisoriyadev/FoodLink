import mongoose from 'mongoose';

const routePointSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const trackingSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      unique: true,
    },
    volunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    currentLocation: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 },
    },
    status: {
      type: String,
      enum: [
        'assigned',
        'travelling_to_pickup',
        'food_picked_up',
        'travelling_to_ngo',
        'delivered',
        'completed',
      ],
      default: 'assigned',
    },
    etaMinutes: {
      type: Number,
      default: 25,
    },
    distanceRemainingKm: {
      type: Number,
      default: 5.0,
    },
    routeHistory: [routePointSchema],
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Tracking = mongoose.model('Tracking', trackingSchema);
export default Tracking;
