import React from 'react';
import { SlidersHorizontal, ArrowUpDown, Filter, RotateCcw } from 'lucide-react';
import { NewsFilterState, NewsSource } from '../types';

interface NewsFilterBarProps {
  filters: NewsFilterState;
  onFilterChange: (updates: Partial<NewsFilterState>) => void;
  onResetFilters: () => void;
  sources: NewsSource[];
  totalResults: number;
}

export const NewsFilterBar: React.FC<NewsFilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  sources,
  totalResults,
}) => {
  const isFiltered = Boolean(
    filters.sourceId ||
    filters.minReadability ||
    filters.sentiment ||
    filters.biasLevel ||
    filters.sortBy !== 'publishedAt' ||
    filters.search
  );

  return (
    <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center text-xs font-semibold text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5 mr-1" /> Filters:
          </div>

          {/* Sources Dropdown */}
          <select
            value={filters.sourceId}
            onChange={(e) => onFilterChange({ sourceId: e.target.value, page: 1 })}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Readability Filter */}
          <select
            value={filters.minReadability !== undefined ? String(filters.minReadability) : ''}
            onChange={(e) => {
              const val = e.target.value ? Number(e.target.value) : undefined;
              onFilterChange({ minReadability: val, page: 1 });
            }}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Readability: Any</option>
            <option value="80">Easy Reading (80+ Ease)</option>
            <option value="60">Standard / Plain English (60+)</option>
            <option value="40">Advanced / Collegiate (40+)</option>
          </select>

          {/* Sentiment Filter */}
          <select
            value={filters.sentiment || ''}
            onChange={(e) => onFilterChange({ sentiment: e.target.value || undefined, page: 1 })}
            className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Sentiment: Any</option>
            <option value="positive">Positive Tone</option>
            <option value="neutral">Neutral Tone</option>
            <option value="negative">Negative Tone</option>
          </select>

          {/* Reset Filters */}
          {isFiltered && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset
            </button>
          )}
        </div>

        {/* Right: Sorting and Count */}
        <div className="flex items-center justify-between lg:justify-end space-x-3 text-xs">
          <span className="text-slate-500 font-medium">
            Showing <strong className="text-slate-900">{totalResults}</strong> articles
          </span>

          <div className="flex items-center space-x-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ sortBy: e.target.value as any, page: 1 })}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 font-semibold text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="publishedAt">Newest First</option>
              <option value="readability">Highest Readability</option>
              <option value="quality">Quality Score</option>
              <option value="title">Headline (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
