import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Upload, X, MapPin, Clock, Info, Sparkles, PackageOpen } from 'lucide-react';
import NgoRecommendationCard from '../../components/ai/NgoRecommendationCard';

const CreateDonation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [existingImages, setExistingImages] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [aiNgos, setAiNgos] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);

  const selectedCategory = watch('category');
  const selectedQuantity = watch('quantity');

  useEffect(() => {
    const fetchAiMatches = async () => {
      if (!selectedCategory) return;
      setLoadingAi(true);
      try {
        const res = await api.get('/ai/recommend-ngos', {
          params: {
            category: selectedCategory || 'Cooked',
            quantity: selectedQuantity || 10,
          }
        });
        setAiNgos(res.data.recommendations || []);
      } catch {
        // Silent fallback
      } finally {
        setLoadingAi(false);
      }
    };
    const timer = setTimeout(fetchAiMatches, 500);
    return () => clearTimeout(timer);
  }, [selectedCategory, selectedQuantity]);

  useEffect(() => {
    if (location.state?.duplicateFrom) {
      const data = location.state.duplicateFrom;
      
      const formatForInput = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      };

      reset({
        title: `${data.title} (Copy)`,
        category: data.category,
        mealType: data.mealType,
        quantity: data.quantity,
        unit: data.unit,
        peopleServed: data.peopleServed,
        description: data.description,
        preparationDate: formatForInput(data.preparationDate),
        expiryDate: formatForInput(data.expiryDate),
        pickupStart: formatForInput(data.pickupWindow?.start),
        pickupEnd: formatForInput(data.pickupWindow?.end),
        address: data.location?.address,
        city: data.location?.city,
        state: data.location?.state,
        pincode: data.location?.pincode,
        specialInstructions: data.specialInstructions,
        foodCondition: data.foodCondition,
        isVeg: data.dietary?.isVeg?.toString() || 'true',
        allergens: data.dietary?.allergens?.join(', ') || '',
        refrigerationRequired: data.refrigerationRequired,
        contactNumber: data.contactNumber,
      });

      setExistingImages(data.images || []);
    }
  }, [location.state, reset]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newImages = [...images, ...files];
    setImages(newImages);

    // Create previews
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...imagePreviews];
    URL.revokeObjectURL(newPreviews[index]); // Free memory
    newPreviews.splice(index, 1);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (index) => {
    const updated = [...existingImages];
    updated.splice(index, 1);
    setExistingImages(updated);
  };

  const onSubmit = async (data) => {
    if (images.length === 0 && existingImages.length === 0) {
      toast.error('Please upload at least one image of the food');
      return;
    }

    console.log("Submitting Data:", data);
    try {
      const descVal = document.querySelector('textarea[name="description"]')?.value;
      const mealVal = document.querySelector('select[name="mealType"]')?.value;
      console.log("DOM values -> desc:", descVal, "meal:", mealVal);
    } catch(e) {}
    setLoading(true);
    try {
      const formData = new FormData();
      
      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }
      
      // Append basic text fields
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

      // Append complex objects as JSON strings
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

      // Append images
      images.forEach(image => {
        formData.append('images', image);
      });

      await api.post('/donations', formData);

      toast.success('Donation created successfully!');
      navigate('/dashboard/donations');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create donation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="md:flex md:items-center md:justify-between mb-8">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:truncate">
            Donate Surplus Food
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Please provide accurate details to help NGOs and volunteers process your donation quickly.
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden"
      >
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
                  placeholder="e.g., 50 Servings of Veg Biryani"
                />
                {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Category</label>
                <select
                  {...register('category', { required: 'Category is required' })}
                  className="mt-1 block w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                >
                  <option value="">Select Category</option>
                  <option value="Cooked">Cooked Meal</option>
                  <option value="Raw">Raw Ingredients</option>
                  <option value="Packaged">Packaged Goods</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Baked">Baked Goods</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
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
                  placeholder="Describe the food items included..."
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
                  placeholder="e.g., Peanuts, Dairy, Gluten (Leave blank if none)"
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
                  placeholder="Street Address / Building Name"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  {...register('city', { required: 'Required' })}
                  placeholder="City"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  {...register('state', { required: 'Required' })}
                  placeholder="State"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <input
                  type="text"
                  {...register('pincode', { required: 'Required' })}
                  placeholder="Pincode"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                 <label className="block text-sm font-medium text-slate-700">Contact Number</label>
                 <input
                  type="tel"
                  {...register('contactNumber', { required: 'Required' })}
                  placeholder="Phone number for pickup"
                  className="mt-1 block w-full border border-slate-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
                />
              </div>

              <div className="sm:col-span-3">
                 <label className="block text-sm font-medium text-slate-700">Special Instructions</label>
                 <input
                  type="text"
                  {...register('specialInstructions')}
                  placeholder="e.g., Ask for manager, use rear entrance"
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

            {/* Existing Images (Duplicated) */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Copied Images:</p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {existingImages.map((img, index) => (
                    <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group">
                      <img src={img.url} alt="Duplicated" className="w-full h-full object-cover" />
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
                  <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-emerald-600 hover:text-emerald-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-emerald-500">
                    <span>Upload files</span>
                    <input id="file-upload" type="file" multiple accept="image/*" className="sr-only" onChange={handleImageChange} />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-slate-500">PNG, JPG up to 5MB (Max 5 photos)</p>
              </div>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
                {imagePreviews.map((src, index) => (
                  <div key={index} className="relative rounded-lg overflow-hidden border border-slate-200 aspect-square group">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Smart NGO Matching Preview */}
          {aiNgos.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">AI Matched Partner NGOs Nearby</h3>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">Top 5 Matches</span>
              </div>
              <p className="text-xs text-slate-500">Based on food category, operating radius, and current capacity.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {aiNgos.slice(0, 2).map((ngo, idx) => (
                  <NgoRecommendationCard key={ngo.ngoId} ngo={ngo} rank={idx} />
                ))}
              </div>
            </div>
          )}

          <div className="pt-5 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="bg-white py-2 px-4 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Submitting...' : 'Post Donation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default CreateDonation;
