import React from 'react';
import { Clock, ShieldAlert, Sparkles } from 'lucide-react';

const FreshnessBadge = ({ preparationDate, expiryDate, score: providedScore, label: providedLabel }) => {
  const calculateLocalFreshness = () => {
    if (providedScore !== undefined && providedLabel !== undefined) {
      return { score: providedScore, label: providedLabel };
    }

    if (!preparationDate || !expiryDate) {
      return { score: 100, label: 'Fresh' };
    }

    const prep = new Date(preparationDate).getTime();
    const exp = new Date(expiryDate).getTime();
    const now = new Date().getTime();

    if (now >= exp) return { score: 0, label: 'Expired' };
    const total = exp - prep;
    if (total <= 0) return { score: 0, label: 'Expired' };

    const score = Math.max(0, Math.min(100, Math.round(((exp - now) / total) * 100)));
    let label = 'Fresh';
    if (score < 25) label = 'Urgent';
    else if (score < 60) label = 'Moderate';

    return { score, label };
  };

  const { score, label } = calculateLocalFreshness();

  const getStyle = () => {
    switch (label) {
      case 'Expired':
        return {
          bg: 'bg-red-50 text-red-700 border-red-200',
          dot: 'bg-red-500',
          icon: ShieldAlert,
        };
      case 'Urgent':
        return {
          bg: 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse',
          dot: 'bg-orange-500',
          icon: Clock,
        };
      case 'Moderate':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          icon: Clock,
        };
      default:
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: Sparkles,
        };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-xs ${style.bg}`}
      title={`AI Freshness Score: ${score}%`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      <Icon className="w-3.5 h-3.5" />
      <span>{label} ({score}%)</span>
    </div>
  );
};

export default FreshnessBadge;
