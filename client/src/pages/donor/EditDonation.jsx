import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, X, MapPin, Clock, Info, PackageOpen } from 'lucide-react';

const EditDonation = () => {
  const { id } = useParams();
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  // Existing images from DB
  const [existingImages, setExistingImages] = useState([]);
  
  // New images to upload
  const [newImages, setNewImages] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  useEffect(() => {
    const fetchDonation = async () => {
      try {
        const { data } = await api.get(`/donations/${id}`);
        
        // Ensure only available donations can be edited
        if (data.status !== 'available') {
          toast.error('Cannot edit a donation that is already claimed');
          navigate(`/dashboard/donations/${id}`);
          return;
        }

        // Format dates for datetime-local input
        const formatForInput = (dateStr) => {
          const d = new Date(dateStr);
          return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
        };

        // Populate form
        reset({
          title: data.title,
          category: data.category,
          mealType: data.mealType,
          quantity: data.quantity,
          unit: data.unit,
          peopleServed: data.peopleServed,
          description: data.description,
          preparationDate: formatForInput(data.preparationDate),
          expiryDate: formatForInput(data.expiryDate),
          pickupStart: formatForInput(data.pickupWindow.start),
          pickupEnd: formatForInput(data.pickupWindow.end),
          address: data.location.address,
          city: data.location.city,
          state: data.location.state,
          pincode: data.location.pincode,
          specialInstructions: data.specialInstructions,
          foodCondition: data.foodCondition,
          isVeg: data.dietary.isVeg.toString(),
          allergens: data.dietary.allergens.join(', '),
          refrigerationRequired: data.refrigerationRequired,
          contactNumber: data.contactNumber,
        });

        setExistingImages(data.images || []);
      } catch (error) {
        toast.error('Failed to load donation details');
        navigate('/dashboard/donations');
      } finally {
        setFetching(false);
      }
    };
    fetchDonation();
  }, [id, reset, navigate]);

  const handleNewImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Total images = existing + new
    if (existingImages.length + newImages.length + files.length > 5) {
      toast.error('Maximum 5 images allowed total');
      return;
    }

    const updatedNewImages = [...newImages, ...files];
    setNewImages(updatedNewImages);

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setNewImagePreviews([...newImagePreviews, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    const updated = [...newImages];
    updated.splice(index, 1);
    setNewImages(updated);

    const previews = [...newImagePreviews];
    URL.revokeObjectURL(previews[index]);
    previews.splice(index, 1);
    setNewImagePreviews(previews);
  };

  const removeExistingImage = (index) => {
    const updated = [...existingImages];
    updated.splice(index, 1);
    setExistingImages(updated);
  };

  const onSubmit = async (data) => {
    if (existingImages.length === 0 && newImages.length === 0) {
      toast.error('Please provide at least one image of the food');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Basic text fields
      formData.append('title', data.title);
      formData.append('category', data.category);
      formData.append('mealType', data.mealType);
      formData.append('quantity', data.quantity);
      formData.append('unit', data.unit);
      formData.append('peopleServed', data.peopleServed);
      formData.append('description', data.description);
      formData.append('preparationDate', data.preparationDate);
      formData.append('expiryDate', data.expiryDate);
      formData.append('specialInstructions', data.specialInstructions);
      formData.append('foodCondition', data.foodCondition);
      formData.append('refrigerationRequired', data.refrigerationRequired);
      formData.append('contactNumber', data.contactNumber);

      formData.append('location', JSON.stringify({
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode
      }));

      formData.append('dietary', JSON.stringify({
        isVeg: data.isVeg === 'true',
        allergens: data.allergens ? data.allergens.split(',').map(a => a.trim()) : []
      }));

      formData.append('pickupWindow', JSON.stringify({
        start: data.pickupStart,
        end: data.pickupEnd
      }));

      // Append new images (Backend currently replaces all if new ones are sent, 
      // but a full implementation would pass a list of existing images to keep)
      newImages.forEach(image => {
        formData.append('images', image);
      });

      await api.put(`/donations/${id}`, formData);

      toast.success('Donation updated successfully!');
      navigate(`/dashboard/donations/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update donation');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Edit Donation
          </h2>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden"
      >
        {/* Same form layout as CreateDonation */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
          
          {/* Section 1: Basic Food Info */}
          <div>
            <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center mb-4 border-b pb-2">
              <PackageOpen className="w-5 h-5 mr-2 text-emerald-500" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-slate-700">Food Title</label>
                <input
                  type="text"
                  {...register('title', { required: 'Title is required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="Cooked">Cooked Meal</option>
                  <option value="Raw">Raw Ingredients</option>
                  <option value="Packaged">Packaged Goods</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Baked">Baked Goods</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Quantity</label>
                <input
                  type="number"
                  {...register('quantity', { required: 'Required', min: 1 })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Unit</label>
                <select
                  {...register('unit', { required: 'Required' })}
                  className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="Meals">Meals</option>
                  <option value="Kg">Kg</option>
                  <option value="Packets">Packets</option>
                  <option value="Liters">Liters</option>
                  <option value="Pieces">Pieces</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">People Served (Approx)</label>
                <input
                  type="number"
                  {...register('peopleServed', { required: 'Required', min: 1 })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-slate-700">Description</label>
                <textarea
                  rows={3}
                  {...register('description', { required: 'Description is required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Condition & Dietary */}
          <div>
             <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center mb-4 border-b pb-2">
              <Info className="w-5 h-5 mr-2 text-emerald-500" /> Condition & Dietary
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Food Condition</label>
                <select
                  {...register('foodCondition')}
                  className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="Fresh">Freshly Prepared</option>
                  <option value="Leftover">Leftover / Buffet</option>
                  <option value="Packaged Unopened">Packaged & Unopened</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Meal Type</label>
                <select
                  {...register('mealType')}
                  className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Snacks">Snacks</option>
                  <option value="Any">Any</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Dietary Type</label>
                <select
                  {...register('isVeg')}
                  className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="true">100% Vegetarian</option>
                  <option value="false">Contains Non-Veg</option>
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-slate-700">Allergens (Comma separated)</label>
                <input
                  type="text"
                  {...register('allergens')}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2 flex items-center mt-6">
                <input
                  id="refrigerationRequired"
                  type="checkbox"
                  {...register('refrigerationRequired')}
                  className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded"
                />
                <label htmlFor="refrigerationRequired" className="ml-2 block text-sm text-slate-700">
                  Requires Refrigeration
                </label>
              </div>
            </div>
          </div>

          {/* Section 3: Timing & Location */}
          <div>
            <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center mb-4 border-b pb-2">
              <Clock className="w-5 h-5 mr-2 text-emerald-500" /> Timing & Location
            </h3>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              
              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700">Prepared On</label>
                <input
                  type="datetime-local"
                  {...register('preparationDate', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700">Expires By</label>
                <input
                  type="datetime-local"
                  {...register('expiryDate', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700">Pickup Window Start</label>
                <input
                  type="datetime-local"
                  {...register('pickupStart', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-sm font-medium text-slate-700">Pickup Window End</label>
                <input
                  type="datetime-local"
                  {...register('pickupEnd', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-6 mt-4">
                 <div className="flex items-center text-sm font-medium text-slate-700 mb-2">
                    <MapPin className="w-4 h-4 mr-1 text-slate-400" /> Pickup Address
                 </div>
              </div>

              <div className="sm:col-span-6">
                <input
                  type="text"
                  {...register('address', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  {...register('city', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  {...register('state', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  {...register('pincode', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                 <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                 <input
                  type="tel"
                  {...register('contactNumber', { required: 'Required' })}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                 <label className="block text-sm font-medium text-slate-700">Special Instructions</label>
                 <input
                  type="text"
                  {...register('specialInstructions')}
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Images */}
          <div>
            <h3 className="text-lg leading-6 font-medium text-slate-900 flex items-center mb-4 border-b pb-2">
              <Upload className="w-5 h-5 mr-2 text-emerald-500" /> Food Images
            </h3>
            
            <p className="text-sm text-slate-500 mb-4">Note: Uploading new images will replace existing ones (demo behavior).</p>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-slate-700 mb-2">Current Images:</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {existingImages.map((img, index) => (
                    <div key={img.public_id} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group">
                      <img src={img.url} alt="Existing" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md hover:bg-slate-50 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <div className="flex text-sm text-slate-600 justify-center">
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500">
                    <span>Upload new files</span>
                    <input id="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleNewImageChange} />
                  </label>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB</p>
              </div>
            </div>

            {/* New Image Previews */}
            {newImagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {newImagePreviews.map((src, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group">
                    <img src={src} alt="New Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-5 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Updating...' : 'Update Donation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EditDonation;
