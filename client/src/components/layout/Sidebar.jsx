import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  PlusCircle, 
  List, 
  Settings,
  HeartHandshake,
  PackageOpen,
  ClipboardList,
  Users,
  History,
  BarChart3,
  Truck,
  Bell,
  Sparkles,
  Search,
  MessageSquare,
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();

  const getNavLinks = () => {
    switch (user?.role) {
      case 'donor':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Donate Food', path: '/dashboard/donations/create', icon: PlusCircle },
          { name: 'My Donations', path: '/dashboard/donations', icon: List },
          { name: 'AI Smart Search', path: '/dashboard/ai/search', icon: Sparkles },
          { name: 'Messages & Chat', path: '/dashboard/chat', icon: MessageSquare },
          { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { name: 'Profile Settings', path: '/dashboard/profile', icon: Settings },
        ];
      case 'ngo':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Available Food', path: '/dashboard/ngo/available', icon: PackageOpen },
          { name: 'AI Smart Search', path: '/dashboard/ai/search', icon: Sparkles },
          { name: 'Messages & Chat', path: '/dashboard/chat', icon: MessageSquare },
          { name: 'My Requests', path: '/dashboard/ngo/accepted', icon: ClipboardList },
          { name: 'Volunteers', path: '/dashboard/ngo/volunteers', icon: Users },
          { name: 'Request History', path: '/dashboard/ngo/history', icon: History },
          { name: 'Reports & Analytics', path: '/dashboard/ngo/reports', icon: BarChart3 },
          { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { name: 'Profile Settings', path: '/dashboard/profile', icon: Settings },
        ];
      case 'volunteer':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Find Delivery Jobs', path: '/dashboard/volunteer/tasks', icon: PackageOpen },
          { name: 'AI Smart Search', path: '/dashboard/ai/search', icon: Sparkles },
          { name: 'Messages & Chat', path: '/dashboard/chat', icon: MessageSquare },
          { name: 'Active Deliveries', path: '/dashboard/volunteer/deliveries', icon: Truck },
          { name: 'Delivery History', path: '/dashboard/volunteer/history', icon: History },
          { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { name: 'Profile Settings', path: '/dashboard/profile', icon: Settings },
        ];
      case 'admin':
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'AI Analytics Hub', path: '/dashboard/admin/analytics', icon: Sparkles },
          { name: 'AI Smart Search', path: '/dashboard/ai/search', icon: Search },
          { name: 'Messages & Chat', path: '/dashboard/chat', icon: MessageSquare },
          { name: 'User Management', path: '/dashboard/admin/users', icon: Users },
          { name: 'Donation Management', path: '/dashboard/admin/donations', icon: PackageOpen },
          { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { name: 'Profile Settings', path: '/dashboard/profile', icon: Settings },
        ];
      default:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Notifications', path: '/dashboard/notifications', icon: Bell },
          { name: 'Profile Settings', path: '/dashboard/profile', icon: Settings },
        ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-16 border-b border-slate-200 px-6">
          <HeartHandshake className="h-8 w-8 text-emerald-600 mr-2" />
          <span className="text-2xl font-bold text-emerald-600 tracking-tight">FoodLink</span>
        </div>

        <div className="flex flex-col h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-6">
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Menu
            </p>
            <nav className="space-y-1">
              {navLinks.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  onClick={() => setIsOpen(false)}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-600'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors ${
                          isActive ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-500'
                        }`}
                      />
                      {item.name}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* User info card at bottom of sidebar */}
          <div className="mt-auto p-4 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs font-medium text-slate-500 capitalize truncate">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
