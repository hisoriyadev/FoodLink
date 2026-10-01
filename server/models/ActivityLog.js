import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  actionType: {
    type: String,
    enum: [
      'USER_REGISTERED',
      'DONATION_CREATED',
      'NGO_APPROVED',
      'NGO_REJECTED',
      'USER_SUSPENDED',
      'SYSTEM_ALERT',
      'SETTINGS_UPDATED',
      'VOLUNTEER_ASSIGNED',
      'DONATION_PICKED_UP',
      'DONATION_DELIVERED',
      'VOLUNTEER_RATED',
      'FEEDBACK_SUBMITTED',
      'DELIVERY_STARTED',
      'PROFILE_UPDATED',
    ],
    required: true
  },
  description: { type: String, required: true },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetDonation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation'
  },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
