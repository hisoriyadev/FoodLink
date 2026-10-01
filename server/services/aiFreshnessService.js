/**
 * AI Freshness Service for FoodLink
 * Calculates food freshness score (0-100%), status category, and visual indicators.
 */

/**
 * Calculates freshness percentage and label for a donation.
 * @param {Date|string} preparationDate 
 * @param {Date|string} expiryDate 
 * @param {Date|string} [currentTime=new Date()] 
 * @returns {Object} { score, label, color, badgeClass, remainingHours }
 */
export const calculateFreshness = (preparationDate, expiryDate, currentTime = new Date()) => {
  const prepTime = new Date(preparationDate).getTime();
  const expTime = new Date(expiryDate).getTime();
  const now = new Date(currentTime).getTime();

  if (isNaN(prepTime) || isNaN(expTime)) {
    return {
      score: 50,
      label: 'Moderate',
      color: '#f59e0b',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
      remainingHours: 0,
    };
  }

  // Already expired
  if (now >= expTime) {
    return {
      score: 0,
      label: 'Expired',
      color: '#ef4444',
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      remainingHours: 0,
    };
  }

  const totalDuration = expTime - prepTime;
  const timeElapsed = now - prepTime;
  const timeRemaining = expTime - now;

  // Protect against edge cases where prepTime >= expTime
  if (totalDuration <= 0) {
    return {
      score: 0,
      label: 'Expired',
      color: '#ef4444',
      badgeClass: 'bg-red-100 text-red-800 border-red-300',
      remainingHours: 0,
    };
  }

  // Calculate percentage (100% when freshly prepared, 0% at expiry)
  const score = Math.max(0, Math.min(100, Math.round(((totalDuration - Math.max(0, timeElapsed)) / totalDuration) * 100)));
  const remainingHours = Math.max(0, parseFloat((timeRemaining / (1000 * 60 * 60)).toFixed(1)));

  let label = 'Fresh';
  let color = '#10b981'; // Green
  let badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';

  if (score < 25 || remainingHours <= 3) {
    label = 'Urgent';
    color = '#f97316'; // Orange/Red
    badgeClass = 'bg-orange-100 text-orange-800 border-orange-300 animate-pulse';
  } else if (score < 60 || remainingHours <= 8) {
    label = 'Moderate';
    color = '#f59e0b'; // Amber
    badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
  }

  return {
    score,
    label,
    color,
    badgeClass,
    remainingHours,
  };
};
