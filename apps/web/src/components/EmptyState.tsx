import React from 'react';
import { Newspaper, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onReset?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No articles match your search or filters',
  description = 'Try loosening your filter constraints, clearing the search query, or refreshing the live feed.',
  onReset,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm my-8">
      <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Newspaper className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
        {description}
      </p>

      {onReset && (
        <button
          onClick={onReset}
          className="inline-flex items-center px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
          Reset All Filters
        </button>
      )}
    </div>
  );
};
