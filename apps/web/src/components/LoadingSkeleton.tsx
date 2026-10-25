import React from 'react';

export const LoadingSkeleton: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col p-4 space-y-3">
          <div className="bg-slate-200 h-44 rounded-xl w-full" />
          <div className="flex justify-between items-center">
            <div className="bg-slate-200 h-4 w-24 rounded" />
            <div className="bg-slate-200 h-4 w-16 rounded" />
          </div>
          <div className="bg-slate-200 h-6 w-full rounded" />
          <div className="bg-slate-200 h-4 w-3/4 rounded" />
          <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
            <div className="bg-slate-200 h-5 w-28 rounded" />
            <div className="bg-slate-200 h-5 w-20 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};
