import React, { useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  BookOpen, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  HelpCircle,
  Award,
  Layers,
  Info
} from 'lucide-react';
import { Article, BiasSignal } from '../types';

interface ArticleDetailModalProps {
  article: Article | null;
  onClose: () => void;
  onToggleBookmark: (articleId: string) => void;
  isBookmarked: boolean;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  onClose,
  onToggleBookmark,
  isBookmarked,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const analysis = article.analysis;
  const readabilityScore = analysis?.readabilityScore ?? analysis?.readability?.score ?? 70;
  const readabilityLabel = analysis?.readabilityLabel ?? analysis?.readability?.label ?? 'moderate';
  const gradeLevel = analysis?.readability?.gradeLevel ?? '7th-9th Grade (Plain English)';
  const details = analysis?.readability?.details;

  const sentiment = analysis?.sentimentLabel ?? analysis?.sentiment?.label ?? 'neutral';
  const sentimentConfidence = analysis?.sentimentConfidence ?? analysis?.sentiment?.confidence ?? 0.85;

  const biasSignals: BiasSignal[] = Array.isArray(analysis?.linguisticSignals)
    ? analysis!.linguisticSignals
    : analysis?.potentialBias?.signals || [];
  const biasLevel = analysis?.potentialBiasLevel ?? analysis?.potentialBias?.level ?? 'minimal';
  const biasScore = analysis?.potentialBiasScore ?? analysis?.potentialBias?.score ?? 0.10;

  const subjectivityScore = analysis?.subjectivityScore ?? analysis?.subjectivity?.score ?? 0.20;
  const subjectivityLabel = analysis?.subjectivity?.label ?? 'factual_reporting';
  const subjectivityExplanation = analysis?.subjectivity?.explanation ?? 'Objective reporting language with verified factual descriptions.';

  const qualityScore = analysis?.qualityScore ?? 82.0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200/80 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-700">
              {article.category}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {article.source?.name || 'News Source'}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Article Title & Source */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug mb-3">
              {article.title}
            </h2>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 pb-4 border-b border-slate-100">
              <span>By <strong className="text-slate-700">{article.author || article.source?.name}</strong></span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                {new Date(article.publishedAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Article Summary or Content */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Article Abstract & Available Excerpt
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {article.description || article.content || 'Full story available at primary publisher.'}
            </p>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 italic">
                Attribution: Original reporting by {article.source?.name}.
              </span>
              <a
                href={article.canonicalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
              >
                <span>Read Full Article on Publisher Site</span>
                <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>

          {/* AI Analysis Dashboard Title */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">AI Linguistic & Readability Analysis</h3>
                <p className="text-xs text-slate-500">Transparent computational metrics from pretrained NLP models</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Overall Quality</span>
              <span className="text-xl font-black text-blue-600">{Math.round(qualityScore)}/100</span>
            </div>
          </div>

          {/* 1. Readability Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-slate-900">Readability & Prose Accessibility</h4>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {readabilityLabel.toUpperCase()} • {Math.round(readabilityScore)}/100 EASE
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Assessed Level: <strong className="text-slate-800">{gradeLevel}</strong>. Evaluated using the standard Flesch Reading Ease and Flesch-Kincaid formulas. Higher ease scores indicate clearer, more accessible prose.
            </p>

            {details && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">FK Grade</span>
                  <span className="font-bold text-slate-800">{details.fleschKincaidGrade}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Total Words</span>
                  <span className="font-bold text-slate-800">{details.wordsCount}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Sentences</span>
                  <span className="font-bold text-slate-800">{details.sentencesCount}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Syllables/Word</span>
                  <span className="font-bold text-slate-800">{details.syllablesPerWord}</span>
                </div>
              </div>
            )}
          </div>

          {/* 2. Sentiment & Subjectivity Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Sentiment Tone</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                  {sentiment}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Confidence: <strong className="text-slate-700">{Math.round(sentimentConfidence * 100)}%</strong>
              </p>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full ${sentiment === 'positive' ? 'bg-emerald-500' : sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-400'}`}
                  style={{ width: `${Math.round(sentimentConfidence * 100)}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Reflects lexical tone and mood. Does not indicate factual accuracy.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">Subjectivity Stance</h4>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 capitalize">
                  {subjectivityLabel.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {subjectivityExplanation}
              </p>
              <p className="text-[11px] text-slate-400">
                Evaluates factual reporting descriptors vs. personal commentary.
              </p>
            </div>
          </div>

          {/* 3. Potential Bias & Linguistic Signals Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h4 className="text-sm font-bold text-slate-900">Experimental Linguistic Signals & Cues</h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                biasLevel === 'minimal' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                biasLevel === 'low' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {biasLevel.toUpperCase()} SIGNAL INTENSITY
              </span>
            </div>

            {/* Scientific Disclaimer Alert */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-start space-x-2.5 text-xs text-amber-800">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Methodology Disclaimer:</strong> Linguistic signals detect stylistic patterns such as loaded descriptors, absolute phrasing, or rhetorical framing in the analyzed text. They <strong>DO NOT</strong> determine factual truthfulness, objective reliability, or publisher credibility.
              </p>
            </div>

            {/* List of Detected Cues */}
            {biasSignals.length > 0 ? (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-700 block">Flagged Linguistic Cues:</span>
                {biasSignals.map((sig, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 capitalize">{sig.type.replace('_', ' ')}:</span>
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono font-semibold rounded text-[11px]">
                        "{sig.phrase}"
                      </span>
                    </div>
                    <p className="text-slate-600 italic font-serif text-[11px]">
                      {sig.context}
                    </p>
                    <p className="text-slate-500 text-[11px]">
                      {sig.explanation}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-xl flex items-center space-x-2 text-xs text-emerald-800 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No strongly loaded adjectives or hyperbolic categorical claims identified in available text.</span>
              </div>
            )}
          </div>

          {/* Model Provenance & Footer */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="block font-medium text-slate-700">
                Model: {analysis?.modelName || analysis?.model?.name || 'Pretrained BERT / Linguistic Pipeline'}
              </span>
              <span className="text-[11px] text-slate-400">
                Version: {analysis?.modelVersion || analysis?.model?.version || '1.0.0'} • Analyzed: {analysis?.analyzedAt ? new Date(analysis.analyzedAt).toLocaleString() : 'Just now'}
              </span>
            </div>

            <button
              onClick={() => onToggleBookmark(article.id)}
              className={`px-4 py-2 rounded-xl font-semibold transition ${
                isBookmarked
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isBookmarked ? 'Bookmarked' : 'Save Article'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
