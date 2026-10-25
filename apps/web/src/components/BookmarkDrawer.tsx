import React from 'react';
import { X, Bookmark, ExternalLink, Trash2, BookOpen } from 'lucide-react';
import { Article } from '../types';

interface BookmarkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bookmarks: Article[];
  onRemoveBookmark: (articleId: string) => void;
  onOpenArticle: (article: Article) => void;
}

export const BookmarkDrawer: React.FC<BookmarkDrawerProps> = ({
  isOpen,
  onClose,
  bookmarks,
  onRemoveBookmark,
  onOpenArticle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="w-5 h-5 text-blue-600 fill-current" />
            <h3 className="font-bold text-slate-900">Saved Bookmarks</h3>
            <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
              {bookmarks.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {bookmarks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <Bookmark className="w-12 h-12 mb-3 stroke-[1.5] text-slate-300" />
              <p className="font-semibold text-slate-700 text-sm mb-1">No saved stories yet</p>
              <p className="text-xs text-slate-500 max-w-xs">
                Tap the bookmark icon on any article card to curate your personal reading list.
              </p>
            </div>
          ) : (
            bookmarks.map((art) => (
              <div
                key={art.id}
                className="group p-4 bg-slate-50 hover:bg-blue-50/40 rounded-2xl border border-slate-200 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                    <span className="font-bold uppercase tracking-wider text-blue-600">{art.category}</span>
                    <span>{art.source?.name}</span>
                  </div>

                  <h4 
                    onClick={() => { onOpenArticle(art); onClose(); }}
                    className="font-bold text-sm text-slate-900 hover:text-blue-600 cursor-pointer line-clamp-2 mb-2 leading-snug"
                  >
                    {art.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                  <button
                    onClick={() => { onOpenArticle(art); onClose(); }}
                    className="text-blue-600 hover:underline font-semibold"
                  >
                    View Analysis
                  </button>

                  <div className="flex items-center space-x-2">
                    <a
                      href={art.canonicalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-700"
                      title="Open Original"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => onRemoveBookmark(art.id)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
