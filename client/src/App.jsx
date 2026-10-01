import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Shared & Notification Pages
import NotificationPage from './pages/shared/NotificationPage';
import SmartSearchPage from './pages/shared/SmartSearchPage';
import ChatPage from './pages/shared/ChatPage';
import LiveTrackPage from './pages/shared/LiveTrackPage';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';

// Dashboard Components
import DashboardLayout from './components/layout/DashboardLayout';
import CreateDonation from './pages/donor/CreateDonation';
import MyDonations from './pages/donor/MyDonations';
import DonationDetails from './pages/donor/DonationDetails';
import EditDonation from './pages/donor/EditDonation';
import Profile from './pages/shared/Profile';

// NGO Pages
import AvailableDonations from './pages/ngo/AvailableDonations';
import NgoDonationDetails from './pages/ngo/NgoDonationDetails';
import AcceptedDonations from './pages/ngo/AcceptedDonations';
import VolunteerManagement from './pages/ngo/VolunteerManagement';
import RequestHistory from './pages/ngo/RequestHistory';
import NgoReports from './pages/ngo/NgoReports';

// Volunteer Pages
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import VolunteerTasks from './pages/volunteer/VolunteerTasks';
import VolunteerDonationDetails from './pages/volunteer/VolunteerDonationDetails';
import VolunteerHistory from './pages/volunteer/VolunteerHistory';

// Admin Pages
import UsersManage from './pages/admin/UsersManage';
import DonationsManage from './pages/admin/DonationsManage';
import AdminAnalyticsDashboard from './pages/admin/AdminAnalyticsDashboard';

import { useAuth } from './context/AuthContext';

// Dynamic Details Wrapper to load correct page based on role
const DynamicDonationDetails = () => {
  const { user } = useAuth();
  if (user?.role === 'ngo') {
    return <NgoDonationDetails />;
  }
  if (user?.role === 'volunteer') {
    return <VolunteerDonationDetails />;
  }
  return <DonationDetails />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-slate-50">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Protected Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  {/* Shared & Role-based Dashboard Index */}
                  <Route index element={<Dashboard />} />
                  <Route path="donations" element={<MyDonations />} />
                  <Route path="donations/create" element={<CreateDonation />} />
                  <Route path="donations/:id" element={<DynamicDonationDetails />} />
                  <Route path="donations/:id/edit" element={<EditDonation />} />
                  
                  {/* NGO specific routes */}
                  <Route path="ngo/available" element={<AvailableDonations />} />
                  <Route path="ngo/accepted" element={<AcceptedDonations />} />
                  <Route path="ngo/volunteers" element={<VolunteerManagement />} />
                  <Route path="ngo/history" element={<RequestHistory />} />
                  <Route path="ngo/reports" element={<NgoReports />} />

                  {/* Volunteer specific routes */}
                  <Route path="volunteer/tasks" element={<VolunteerTasks />} />
                  <Route path="volunteer/deliveries" element={<VolunteerDashboard />} />
                  <Route path="volunteer/history" element={<VolunteerHistory />} />
                  
                  {/* Admin specific routes */}
                  <Route path="admin/users" element={<UsersManage />} />
                  <Route path="admin/donations" element={<DonationsManage />} />
                  <Route path="admin/analytics" element={<AdminAnalyticsDashboard />} />

                  {/* Shared Routes */}
                  <Route path="ai/search" element={<SmartSearchPage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="track/:donationId" element={<LiveTrackPage />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="notifications" element={<NotificationPage />} />
                </Route>
              </Route>

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          <Toaster position="top-right" />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
