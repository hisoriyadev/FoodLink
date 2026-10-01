import React from 'react';
import { motion } from 'framer-motion';
import { Building, MapPin, Clock, Award, CheckCircle2, Phone, Mail } from 'lucide-react';

const NgoRecommendationCard = ({ ngo, rank, onSelect }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: rank * 0.1 }}
      className="bg-white border border-slate-200 rounded-xl p-4 hover:border-emerald-500 hover:shadow-md transition-all relative overflow-hidden"
    >
      {rank === 0 && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] uppercase tracking-wider font-extrabold px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
          <Award className="w-3 h-3" /> Top Match
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
            #{rank + 1}
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
              {ngo.organizationName}
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </h4>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400" /> {ngo.address} ({ngo.distanceKm} km away)
            </p>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          <span className="text-2xl font-black text-emerald-600">{ngo.matchScore}%</span>
          <p className="text-[10px] text-slate-400 font-semibold uppercase">Match Score</p>
        </div>
      </div>

      {/* Match Progress Bar */}
      <div className="mt-3 w-full bg-slate-100 h-2 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${ngo.matchScore}%` }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full"
        />
      </div>

      {/* Metrics Row */}
      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          <span>Est. Pickup: <strong>~{ngo.estimatedPickupMins} mins</strong></span>
        </div>
        <div className="flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-blue-500" />
          <span>Active Claims: <strong>{ngo.activeClaimsCount} jobs</strong></span>
        </div>
      </div>

      {onSelect && (
        <button
          onClick={() => onSelect(ngo)}
          className="mt-3 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          Assign To This NGO
        </button>
      )}
    </motion.div>
  );
};

export default NgoRecommendationCard;
