import React from 'react';
import { Sparkles, Clock, ExternalLink, Bookmark, BookOpen, Award } from 'lucide-react';
import { Article } from '../types';

interface FeaturedHeadlineProps {
  article: Article;
  onOpenAnalysis: (article: Article) => void;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
}

export const FeaturedHeadline: React.FC<FeaturedHeadlineProps> = ({
  article,
  onOpenAnalysis,
  isBookmarked,
  onToggleBookmark,
}) => {
  const analysis = article.analysis;
  const readabilityScore = analysis?.readabilityScore ?? analysis?.readability?.score ?? null;
  const sentimentLabel = analysis?.sentimentLabel ?? analysis?.sentiment?.label ?? 'neutral';
  const qualityScore = analysis?.qualityScore ?? 80;

  const getSentimentStyle = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (sentiment === 'negative') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  return (
    <section className="relative overflow-hidden rounded-3xl bg-slate-900 text-white mb-8 shadow-xl border border-slate-800">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Column: Story Details */}
        <div className="p-6 sm:p-10 lg:col-span-7 flex flex-col justify-between space-y-4 z-10">
          <div>
            {/* Top Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-600 text-white animate-pulse">
                Featured Lead
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold capitalize bg-slate-800 text-slate-300 border border-slate-700">
                {article.category}
              </span>
              <span className="text-xs text-slate-400">
                {article.source?.name}
              </span>
            </div>

            {/* Headline */}
            <h1 
              onClick={() => onOpenAnalysis(article)}
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight hover:text-blue-300 cursor-pointer transition"
            >
              {article.title}
            </h1>

            {/* Snippet */}
            {article.description && (
              <p className="mt-3 text-sm sm:text-base text-slate-300 line-clamp-3 leading-relaxed">
                {article.description}
              </p>
            )}
          </div>

          {/* AI Metrics & Actions */}
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Sentiment Tone */}
              <span 
                className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border capitalize ${getSentimentStyle(sentimentLabel)}`}
                title="Linguistic sentiment tone classification"
              >
                <span className={`w-2 h-2 rounded-full mr-1.5 ${
                  sentimentLabel === 'positive' ? 'bg-emerald-400' :
                  sentimentLabel === 'negative' ? 'bg-rose-400' : 'bg-slate-400'
                }`} />
                {sentimentLabel} Tone
              </span>

              {readabilityScore && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-blue-400" />
                  {Math.round(readabilityScore)}/100 Readability Ease
                </span>
              )}

              {qualityScore && (
                <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  <Award className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                  {Math.round(qualityScore)} Quality
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenAnalysis(article)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-blue-600/30"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Inspect AI Analysis
              </button>

              <button
                onClick={() => onToggleBookmark(article.id)}
                className={`p-2 rounded-xl transition border ${
                  isBookmarked
                    ? 'bg-rose-600 text-white border-rose-500'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
                title={isBookmarked ? 'Bookmarked' : 'Save story'}
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Hero Image */}
        <div className="relative lg:col-span-5 aspect-[16/10] lg:aspect-auto h-full min-h-[260px] bg-slate-950">
          <img
            src={article.imageUrl || `https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80`}
            alt={article.title}
            className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1000&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:via-transparent lg:to-transparent"></div>
        </div>
      </div>
    </section>
  );
};
