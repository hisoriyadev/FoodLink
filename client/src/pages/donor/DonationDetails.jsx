import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, MapPin, Clock, PackageOpen, 
  Info, AlertTriangle, Truck, CheckCircle2,
  Calendar, Edit
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';

const DonationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const { socket } = useNotifications();

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const { data } = await api.get(`/donations/${id}`);
        setDonation(data);
      } catch (error) {
        toast.error('Failed to load donation details');
        navigate('/dashboard/donations');
      } finally {
        setLoading(false);
      }
    };
    fetchDonation();

    if (socket) {
      socket.emit('join:donation', id);
      const handleUpdate = (updatedDonation) => {
        if (updatedDonation._id === id) {
          setDonation(updatedDonation);
          toast.success('Live update: Donation status updated!');
        }
      };
      socket.on('donation:updated', handleUpdate);

      return () => {
        socket.emit('leave:donation', id);
        socket.off('donation:updated', handleUpdate);
      };
    }
  }, [id, navigate, socket]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!donation) return null;

  const isEditable = donation.status === 'available';

  // Format dates
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Donations
        </button>
        {isEditable && (
          <Link
            to={`/dashboard/donations/${donation._id}/edit`}
            className="inline-flex items-center px-4 py-2 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none"
          >
            <Edit className="-ml-1 mr-2 h-4 w-4 text-slate-500" />
            Edit Donation
          </Link>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-slate-200 overflow-hidden">
        
        {/* Top Section: Images and Main Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border-b border-slate-200">
          
          {/* Image Gallery */}
          <div className="bg-slate-100 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-200">
            {donation.images && donation.images.length > 0 ? (
              <>
                <div className="w-full aspect-[4/3] rounded-lg overflow-hidden shadow-sm mb-4 bg-white relative">
                  <img 
                    src={donation.images[activeImage].url} 
                    alt="Food" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wider bg-white/90 text-emerald-800 shadow-sm backdrop-blur-sm">
                      {donation.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {/* Thumbnails */}
                <div className="flex gap-2 w-full overflow-x-auto pb-2">
                  {donation.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setActiveImage(index)}
                      className={`relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden ${
                        activeImage === index ? 'ring-2 ring-emerald-500 ring-offset-2' : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${index+1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full aspect-[4/3] rounded-lg bg-slate-200 flex items-center justify-center">
                <p className="text-slate-500">No images available</p>
              </div>
            )}
          </div>

          {/* Quick Info */}
          <div className="p-6 sm:p-8 flex flex-col">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{donation.title}</h1>
            <p className="text-base text-slate-600 mb-6">{donation.description}</p>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <p className="text-sm font-medium text-slate-500 flex items-center">
                  <PackageOpen className="w-4 h-4 mr-1.5" /> Quantity
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{donation.quantity} {donation.unit}</p>
                <p className="text-xs text-slate-500">Serves approx {donation.peopleServed} people</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-slate-500 flex items-center">
                  <Clock className="w-4 h-4 mr-1.5" /> Expiry
                </p>
                <p className="mt-1 text-lg font-semibold text-red-600">{formatDate(donation.expiryDate)}</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 mt-auto">
              <h3 className="text-sm font-bold text-slate-900 flex items-center mb-3">
                <MapPin className="w-4 h-4 mr-1.5 text-emerald-600" /> Pickup Location
              </h3>
              <p className="text-sm text-slate-700">{donation.location.address}</p>
              <p className="text-sm text-slate-700">{donation.location.city}, {donation.location.state} {donation.location.pincode}</p>
              
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Pickup Window</p>
                <p className="text-sm font-medium text-slate-800">
                  {formatDate(donation.pickupWindow.start)} — <br/>
                  {formatDate(donation.pickupWindow.end)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Details Grid & Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          
          {/* Left Column: Deep Details */}
          <div className="lg:col-span-2 p-6 sm:p-8 space-y-8">
            
            <section>
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                <Info className="w-5 h-5 mr-2 text-emerald-500" /> Food Specification
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Category</dt>
                  <dd className="mt-1 text-sm text-slate-900">{donation.category}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Meal Type</dt>
                  <dd className="mt-1 text-sm text-slate-900">{donation.mealType}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Condition</dt>
                  <dd className="mt-1 text-sm text-slate-900">{donation.foodCondition}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-slate-500">Preparation Time</dt>
                  <dd className="mt-1 text-sm text-slate-900">{formatDate(donation.preparationDate)}</dd>
                </div>
              </dl>
            </section>

            <section>
              <h3 className="text-lg font-bold text-slate-900 flex items-center mb-4">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" /> Dietary & Safety
              </h3>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Type</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${donation.dietary.isVeg ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {donation.dietary.isVeg ? '100% Vegetarian' : 'Contains Non-Veg'}
                  </span>
                </div>
                {donation.dietary.allergens && donation.dietary.allergens.length > 0 && (
                  <div className="flex items-center justify-between border-t border-orange-200/50 pt-3">
                    <span className="text-sm font-medium text-slate-700">Allergens</span>
                    <span className="text-sm font-medium text-slate-900">{donation.dietary.allergens.join(', ')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between border-t border-orange-200/50 pt-3">
                  <span className="text-sm font-medium text-slate-700">Refrigeration</span>
                  <span className="text-sm font-medium text-slate-900">{donation.refrigerationRequired ? 'Required' : 'Not Required'}</span>
                </div>
              </div>
            </section>

            {donation.specialInstructions && (
              <section>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Special Instructions</h3>
                <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {donation.specialInstructions}
                </p>
              </section>
            )}

            {/* Assignments */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">NGO Assigned</h4>
                {donation.assignedTo?.ngo ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-md p-3">
                    <p className="font-semibold text-emerald-800">{donation.assignedTo.ngo.name}</p>
                    <p className="text-xs text-emerald-600">{donation.assignedTo.ngo.email}</p>
                    <p className="text-xs text-emerald-600 mt-1">{donation.assignedTo.ngo.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Pending assignment...</p>
                )}
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Volunteer</h4>
                {donation.assignedTo?.volunteer ? (
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                    <p className="font-semibold text-blue-800">{donation.assignedTo.volunteer.name}</p>
                    <p className="text-xs text-blue-600">Phone: {donation.assignedTo.volunteer.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">Waiting for volunteer...</p>
                )}
              </div>
            </section>
          </div>

          {/* Right Column: Timeline */}
          <div className="p-6 sm:p-8 bg-slate-50">
            <h3 className="text-lg font-bold text-slate-900 flex items-center mb-6">
              <Calendar className="w-5 h-5 mr-2 text-emerald-500" /> Tracking History
            </h3>
            
            <div className="flow-root">
              <ul className="-mb-8">
                {donation.statusHistory && donation.statusHistory.map((event, eventIdx) => (
                  <li key={eventIdx}>
                    <div className="relative pb-8">
                      {eventIdx !== donation.statusHistory.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" aria-hidden="true"></span>
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-slate-50 ${
                            event.status === 'delivered' ? 'bg-green-500' :
                            event.status === 'cancelled' || event.status === 'expired' ? 'bg-red-500' :
                            'bg-emerald-500'
                          }`}>
                            <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-slate-900 capitalize font-medium">
                              Marked as {event.status.replace('_', ' ')}
                            </p>
                            {event.note && (
                              <p className="mt-1 text-sm text-slate-500">{event.note}</p>
                            )}
                          </div>
                          <div className="text-right text-xs whitespace-nowrap text-slate-500">
                            <time dateTime={event.timestamp}>{formatDate(event.timestamp)}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationDetails;
