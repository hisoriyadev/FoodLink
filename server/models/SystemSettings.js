import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  websiteName: { type: String, default: 'FoodLink' },
  contactEmail: { type: String, default: 'support@foodlink.app' },
  contactPhone: { type: String, default: '+1234567890' },
  address: { type: String, default: '123 Impact Ave, Tech District' },
  
  emailNotificationsEnabled: { type: Boolean, default: true },
  pushNotificationsEnabled: { type: Boolean, default: true },
  
  aiPrioritizationEnabled: { type: Boolean, default: true },
  autoAssignVolunteers: { type: Boolean, default: false },
  
  themeMode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
  
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);
export default SystemSettings;
