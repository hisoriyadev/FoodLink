import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../notifications/NotificationBell';
import { Menu, ChevronDown, User, LogOut } from 'lucide-react';

const DashboardNavbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10 sticky top-0">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="p-2 mr-4 text-slate-500 rounded-md hover:bg-slate-100 lg:hidden focus:outline-none"
        >
          <Menu className="h-6 w-6" />
        </button>
        
        {/* Breadcrumb or Page Title placeholder could go here */}
        <h1 className="text-xl font-semibold text-slate-800 hidden sm:block capitalize">
          {user?.role} Dashboard
        </h1>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <NotificationBell />

        {/* Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="hidden sm:block h-4 w-4 text-slate-400" />
          </button>

          {showProfileMenu && (
            <>
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowProfileMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/dashboard/profile');
                  }}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <User className="mr-2 h-4 w-4 text-slate-400" />
                  Your Profile
                </button>
                
                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4 text-red-400" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardNavbar;
