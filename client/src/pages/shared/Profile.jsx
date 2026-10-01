import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  User as UserIcon, Mail, MapPin, Phone, Building, 
  Shield, Bell, Upload, Loader2, Key, Check, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [loading, setLoading] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  
  // States for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Forms
  const { register: registerProfile, handleSubmit: handleSubmitProfile, reset: resetProfile, formState: { errors: profileErrors } } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: passwordErrors }, watch: watchPassword } = useForm();

  // Populate profiles form on user change
  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        phone: user.phone || '',
        orgName: user.organizationDetails?.name || '',
        registrationNumber: user.organizationDetails?.registrationNumber || '',
        gstNumber: user.organizationDetails?.gstNumber || '',
        address: user.organizationDetails?.address || '',
        emailNotif: user.notificationSettings?.email ?? true,
        pushNotif: user.notificationSettings?.push ?? true,
      });
    }
  }, [user, resetProfile]);

  const onUpdateProfile = async (data) => {
    setLoading(true);
    try {
      const payload = {
        name: data.name,
        phone: data.phone,
        organizationDetails: {
          name: data.orgName,
          registrationNumber: data.registrationNumber,
          gstNumber: data.gstNumber,
          address: data.address,
        },
        notificationSettings: {
          email: data.emailNotif,
          push: data.pushNotif,
        }
      };

      const res = await api.put('/auth/profile', payload);
      // Update global auth state
      setUser(res.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const onChangePasswordSubmit = async (data) => {
    setLoading(true);
    try {
      await api.put('/auth/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password updated successfully!');
      resetPassword();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password update failed');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePicUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    setUploadingPic(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const res = await api.put('/auth/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setUser(res.data);
      toast.success('Profile picture updated!');
    } catch (error) {
      toast.error('Failed to upload profile picture');
    } finally {
      setUploadingPic(false);
    }
  };

  const tabs = [
    { id: 'account', name: 'Account Info', icon: UserIcon },
    { id: 'business', name: 'Business Details', icon: Building },
    { id: 'security', name: 'Security', icon: Key },
    { id: 'notifications', name: 'Notifications', icon: Bell },
  ];

  const filteredTabs = user?.role === 'donor' || user?.role === 'ngo' 
    ? tabs 
    : tabs.filter(t => t.id !== 'business');

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl">Profile Settings</h2>
        <p className="mt-1 text-sm text-slate-500">Manage your profile details, business entity, security, and notification settings.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-4 min-h-[450px]">
        {/* Navigation Sidebar inside Profile */}
        <div className="bg-slate-50 p-4 border-r border-slate-200 space-y-1">
          {/* Profile Picture Header */}
          <div className="flex flex-col items-center py-4 mb-4 border-b border-slate-200">
            <div className="relative group w-20 h-20 rounded-full overflow-hidden border border-slate-300 bg-emerald-100 flex items-center justify-center text-emerald-700 font-extrabold text-3xl shadow-sm">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
              {uploadingPic ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : (
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white cursor-pointer transition-opacity text-[10px] font-medium">
                  <Upload className="w-4 h-4 mb-1" />
                  Upload
                  <input type="file" onChange={handleProfilePicUpload} accept="image/*" className="hidden" />
                </label>
              )}
            </div>
            <p className="text-sm font-semibold text-slate-900 mt-2 text-center">{user?.name}</p>
            <p className="text-xs text-emerald-600 font-medium capitalize mt-0.5">{user?.role}</p>
          </div>

          {filteredTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="md:col-span-3 p-6 sm:p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'account' && (
              <motion.form
                key="account"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmitProfile(onUpdateProfile)}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Account Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        {...registerProfile('name', { required: 'Name is required' })}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                      {profileErrors.name && <p className="mt-1 text-xs text-red-500">{profileErrors.name.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="mt-1 block w-full border border-slate-200 bg-slate-50 text-slate-400 rounded-md py-2 px-3 sm:text-sm cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone Number</label>
                      <input
                        type="tel"
                        {...registerProfile('phone', { required: 'Phone is required' })}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                      />
                      {profileErrors.phone && <p className="mt-1 text-xs text-red-500">{profileErrors.phone.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'business' && (
              <motion.form
                key="business"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmitProfile(onUpdateProfile)}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Organization / Business details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Business / Organization Name</label>
                      <input
                        type="text"
                        {...registerProfile('orgName', { required: 'Business name is required' })}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration Number</label>
                      <input
                        type="text"
                        {...registerProfile('registrationNumber')}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">GST Number (Optional)</label>
                      <input
                        type="text"
                        {...registerProfile('gstNumber')}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                        placeholder="22AAAAA0000A1Z5"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Physical Address</label>
                      <textarea
                        rows={3}
                        {...registerProfile('address')}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                        placeholder="Street details, city, state, pincode"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Details
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'security' && (
              <motion.form
                key="security"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmitPassword(onChangePasswordSubmit)}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Change Password</h3>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          {...registerPassword('currentPassword', { required: 'Current password is required' })}
                          className="block w-full border border-slate-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.currentPassword.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">New Password</label>
                      <div className="relative mt-1">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          {...registerPassword('newPassword', { 
                            required: 'New password is required',
                            minLength: { value: 6, message: 'Password must be at least 6 characters' }
                          })}
                          className="block w-full border border-slate-300 rounded-md py-2 pl-3 pr-10 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.newPassword.message}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        {...registerPassword('confirmPassword', { 
                          required: 'Please confirm your password',
                          validate: (val) => val === watchPassword('newPassword') || 'Passwords do not match'
                        })}
                        className="mt-1 block w-full border border-slate-300 rounded-md py-2 px-3 focus:outline-none focus:ring-1 focus:ring-emerald-500 sm:text-sm"
                      />
                      {passwordErrors.confirmPassword && <p className="mt-1 text-xs text-red-500">{passwordErrors.confirmPassword.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </motion.form>
            )}

            {activeTab === 'notifications' && (
              <motion.form
                key="notifications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onSubmit={handleSubmitProfile(onUpdateProfile)}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-slate-900 border-b pb-2 mb-4">Notification Preferences</h3>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="emailNotif"
                          type="checkbox"
                          {...registerProfile('emailNotif')}
                          className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="emailNotif" className="font-semibold text-slate-700">Email Notifications</label>
                        <p className="text-slate-500 text-xs mt-0.5">Receive transactional email alerts for donation claims, assignments, and status updates.</p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="pushNotif"
                          type="checkbox"
                          {...registerProfile('pushNotif')}
                          className="focus:ring-emerald-500 h-4 w-4 text-emerald-600 border-slate-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="pushNotif" className="font-semibold text-slate-700">Push Notifications</label>
                        <p className="text-slate-500 text-xs mt-0.5">Show in-browser desktop notifications for real-time activities.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none"
                  >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Preferences
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Profile;
