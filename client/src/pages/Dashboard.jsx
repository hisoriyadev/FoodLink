import { useAuth } from '../context/AuthContext';
import DonorDashboard from './donor/DonorDashboard';
import AdminDashboard from './admin/AdminDashboard';
import NgoDashboard from './ngo/NgoDashboard';
import VolunteerDashboard from './volunteer/VolunteerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  if (user?.role === 'donor') {
    return <DonorDashboard />;
  }

  if (user?.role === 'ngo') {
    return <NgoDashboard />;
  }

  if (user?.role === 'volunteer') {
    return <VolunteerDashboard />;
  }

  // Generic fallback
  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">
          Welcome to FoodLink, {user?.name}!
        </h1>
        <p className="text-gray-600">
          You are logged in as a <span className="font-medium text-emerald-600 capitalize">{user?.role}</span>.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
