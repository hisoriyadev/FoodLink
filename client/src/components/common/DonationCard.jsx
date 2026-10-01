import { Link } from 'react-router-dom';
import { Clock, MapPin, PackageOpen, MoreVertical, Edit, Eye, Trash2, Copy } from 'lucide-react';
import { useState } from 'react';

const DonationCard = ({ donation, onDelete, onDuplicate }) => {
  const [showMenu, setShowMenu] = useState(false);

  // Determine status color
  const statusColors = {
    available: 'bg-emerald-100 text-emerald-800',
    claimed: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-indigo-100 text-indigo-800',
    delivered: 'bg-green-100 text-green-800',
    expired: 'bg-red-100 text-red-800',
    cancelled: 'bg-slate-100 text-slate-800',
  };

  const statusColor = statusColors[donation.status] || 'bg-slate-100 text-slate-800';
  
  // Safe image display
  const imageUrl = donation.images && donation.images.length > 0 
    ? donation.images[0].url 
    : 'https://placehold.co/600x400/e2e8f0/64748b?text=No+Image';

  const isEditable = donation.status === 'available';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow relative">
      <div className="aspect-[16/9] relative bg-slate-100">
        <img 
          src={imageUrl} 
          alt={donation.title} 
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 left-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusColor}`}>
            {donation.status.replace('_', ' ')}
          </span>
        </div>
        
        {/* Dropdown Menu */}
        <div className="absolute top-2 right-2">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-1.5 rounded-full bg-white/90 shadow-sm text-slate-600 hover:text-emerald-600 hover:bg-white focus:outline-none"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-100 z-20 py-1">
                <Link 
                  to={`/dashboard/donations/${donation._id}`}
                  className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="mr-3 h-4 w-4 text-slate-400" /> View Details
                </Link>
                {isEditable && (
                  <Link 
                    to={`/dashboard/donations/${donation._id}/edit`}
                    className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    <Edit className="mr-3 h-4 w-4 text-slate-400" /> Edit
                  </Link>
                )}
                <button 
                  onClick={() => onDuplicate && onDuplicate(donation._id)}
                  className="w-full flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="mr-3 h-4 w-4 text-slate-400" /> Duplicate
                </button>
                {isEditable && (
                  <button 
                    onClick={() => {
                      setShowMenu(false);
                      onDelete && onDelete(donation._id);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="mr-3 h-4 w-4 text-red-400" /> Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="p-5">
        <h3 className="text-lg font-bold text-slate-900 line-clamp-1 mb-2" title={donation.title}>
          {donation.title}
        </h3>
        
        <div className="space-y-2 mt-4">
          <div className="flex items-start text-sm text-slate-600">
            <PackageOpen className="w-4 h-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="truncate">{donation.quantity} {donation.unit} ({donation.category})</span>
          </div>
          
          <div className="flex items-start text-sm text-slate-600">
            <MapPin className="w-4 h-4 mr-2 text-slate-400 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-1">{donation.location.city}, {donation.location.pincode}</span>
          </div>

          <div className="flex items-start text-sm text-slate-600">
            <Clock className="w-4 h-4 mr-2 text-orange-400 mt-0.5 flex-shrink-0" />
            <span className="text-orange-600 font-medium text-xs mt-0.5">
              Expires: {new Date(donation.expiryDate).toLocaleDateString()} {new Date(donation.expiryDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center">
           {donation.assignedTo?.ngo ? (
             <div className="text-xs text-slate-500">
               Assigned to: <span className="font-semibold text-emerald-600">{donation.assignedTo.ngo.name}</span>
             </div>
           ) : (
             <div className="text-xs text-slate-400 italic">Waiting for NGO</div>
           )}
           
           <Link 
              to={`/dashboard/donations/${donation._id}`}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500"
            >
              Details &rarr;
            </Link>
        </div>
      </div>
    </div>
  );
};

export default DonationCard;
