import React from 'react';
import { 
  Bookmark, 
  ExternalLink, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Gauge, 
  AlertTriangle,
  Award
} from 'lucide-react';
import { Article } from '../types';

interface ArticleCardProps {
  article: Article;
  onOpenAnalysis: (article: Article) => void;
  isBookmarked: boolean;
  onToggleBookmark: (articleId: string) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onOpenAnalysis,
  isBookmarked,
  onToggleBookmark,
}) => {
  // Format relative publication time
  const getTimeAgo = (dateStr: string) => {
    try {
      const now = Date.now();
      const past = new Date(dateStr).getTime();
      const diffMin = Math.max(1, Math.floor((now - past) / (1000 * 60)));
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recently';
    }
  };

  // Extract analysis metrics
  const analysis = article.analysis;
  const readabilityScore = analysis?.readabilityScore ?? analysis?.readability?.score ?? null;
  const readabilityLabel = analysis?.readabilityLabel ?? analysis?.readability?.label ?? 'moderate';
  const sentimentLabel = analysis?.sentimentLabel ?? analysis?.sentiment?.label ?? 'neutral';
  const biasLevel = analysis?.potentialBiasLevel ?? analysis?.potentialBias?.level ?? 'minimal';
  const qualityScore = analysis?.qualityScore ?? 75;

  // Readability color styling
  const getReadabilityStyle = (score: number | null) => {
    if (score === null) return 'bg-slate-100 text-slate-600 border-slate-200';
    if (score >= 75) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 55) return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // Sentiment style
  const getSentimentStyle = (sentiment: string) => {
    if (sentiment === 'positive') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (sentiment === 'negative') return 'bg-rose-50 text-rose-700 border-rose-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <article className="group bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Thumbnail Image Header */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <img
          src={article.imageUrl || `https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80`}
          alt={article.title}
          loading="lazy"
          onError={(e) => {
            // Graceful fallback on broken image links
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
        />

        {/* Category Pill Over Image */}
        <div className="absolute top-3 left-3 flex items-center space-x-1.5">
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white shadow-sm">
            {article.category}
          </span>
        </div>

        {/* Bookmark Button Over Image */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(article.id);
          }}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-sm ${
            isBookmarked
              ? 'bg-rose-500 text-white shadow-rose-500/30'
              : 'bg-white/85 text-slate-700 hover:bg-white hover:text-rose-500'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Save to bookmarks'}
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata Row: Source & Timestamp */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2.5">
            <span className="font-semibold text-slate-700 hover:text-blue-600 transition truncate max-w-[65%]">
              {article.source?.name || 'Trusted News Source'}
            </span>
            <span className="flex items-center space-x-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{getTimeAgo(article.publishedAt)}</span>
            </span>
          </div>

          {/* Headline */}
          <h3 
            onClick={() => onOpenAnalysis(article)}
            className="text-base sm:text-lg font-bold text-slate-900 leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer transition mb-2"
          >
            {article.title}
          </h3>

          {/* Snippet Description */}
          {article.description && (
            <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
              {article.description}
            </p>
          )}
        </div>

        {/* Transparent AI Indicators Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {/* Readability Score */}
            <span 
              className={`inline-flex items-center px-2 py-0.5 rounded-md border font-semibold ${getReadabilityStyle(readabilityScore)}`}
              title="Flesch Reading Ease score: higher represents more accessible language"
            >
              <BookOpen className="w-3 h-3 mr-1 opacity-70" />
              {readabilityScore ? `${Math.round(readabilityScore)}/100 Ease` : 'Assessing...'}
            </span>

            {/* Sentiment Indicator */}
            <span 
              className={`inline-flex items-center px-2 py-0.5 rounded-md border font-semibold capitalize ${getSentimentStyle(sentimentLabel)}`}
              title="Linguistic sentiment tone classification"
            >
              {sentimentLabel} Tone
            </span>

            {/* Quality Score Indicator */}
            <span 
              className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold ml-auto"
              title="Transparent score combining readability, completeness, and neutrality"
            >
              <Award className="w-3 h-3 mr-1 text-blue-500" />
              {Math.round(qualityScore)} Quality
            </span>
          </div>

          {/* Card Actions Footer */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={() => onOpenAnalysis(article)}
              className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Deep AI Analysis
            </button>

            <a
              href={article.canonicalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg transition"
            >
              <span>Read Original</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1 text-slate-400" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
};
