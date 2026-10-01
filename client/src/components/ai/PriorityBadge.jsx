import React from 'react';
import { Flame, AlertTriangle, Zap, ArrowDown } from 'lucide-react';

const PriorityBadge = ({ priorityScore = 0 }) => {
  const getPriorityDetails = (score) => {
    if (score >= 75) {
      return {
        level: 'Critical',
        bg: 'bg-red-600 text-white shadow-xs animate-bounce',
        icon: Flame,
      };
    }
    if (score >= 50) {
      return {
        level: 'High',
        bg: 'bg-orange-500 text-white shadow-xs',
        icon: AlertTriangle,
      };
    }
    if (score >= 30) {
      return {
        level: 'Medium',
        bg: 'bg-blue-100 text-blue-800 border border-blue-200',
        icon: Zap,
      };
    }
    return {
      level: 'Low',
      bg: 'bg-slate-100 text-slate-700 border border-slate-200',
      icon: ArrowDown,
    };
  };

  const details = getPriorityDetails(priorityScore);
  const Icon = details.icon;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold ${details.bg}`}
      title={`AI Priority Score: ${priorityScore}/100`}
    >
      <Icon className="w-3 h-3" />
      <span>{details.level} Priority ({priorityScore})</span>
    </div>
  );
};

export default PriorityBadge;
