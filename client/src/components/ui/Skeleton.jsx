import React from 'react';

export const CardSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 animate-pulse">
    <div className="h-6 bg-slate-200 rounded-lg w-2/3" />
    <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
    <div className="h-20 bg-slate-100 rounded-xl" />
    <div className="h-10 bg-slate-200 rounded-xl w-full" />
  </div>
);

export const StatSkeleton = () => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-slate-200 flex-shrink-0" />
    <div className="space-y-2 flex-1">
      <div className="h-3 bg-slate-200 rounded w-1/3" />
      <div className="h-6 bg-slate-200 rounded w-1/2" />
    </div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-12 bg-slate-100 border-b border-slate-200" />
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="h-14 border-b border-slate-100 px-4 flex items-center justify-between gap-4">
        <div className="h-4 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/6" />
        <div className="h-4 bg-slate-200 rounded w-1/5" />
        <div className="h-8 bg-slate-200 rounded-lg w-20" />
      </div>
    ))}
  </div>
);
