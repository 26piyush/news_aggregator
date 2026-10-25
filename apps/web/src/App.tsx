import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Navbar } from './components/Navbar';
import { NewsFilterBar } from './components/NewsFilterBar';
import { ArticleCard } from './components/ArticleCard';
import { FeaturedHeadline } from './components/FeaturedHeadline';
import { ArticleDetailModal } from './components/ArticleDetailModal';
import { BookmarkDrawer } from './components/BookmarkDrawer';
import { AuthModal } from './components/AuthModal';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { EmptyState } from './components/EmptyState';
import { api } from './services/api';
import { Article, NewsFilterState, User } from './types';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

export const App: React.FC = () => {
  const queryClient = useQueryClient();

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  // Filter State
  const [filters, setFilters] = useState<NewsFilterState>({
    category: 'all',
    search: '',
    sourceId: '',
    sortBy: 'publishedAt',
    order: 'desc',
    page: 1,
    limit: 12,
  });

  // UI Overlays State
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isBookmarkDrawerOpen, setIsBookmarkDrawerOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Attempt session restoration on startup
    const token = localStorage.getItem('news_auth_token');
    if (token) {
      api.getCurrentUser()
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('news_auth_token');
          // Initialize guest session
          api.guestLogin().then((res) => setUser(res.user));
        });
    } else {
      const existingGuest = localStorage.getItem('news_guest_id');
      api.guestLogin(existingGuest || undefined)
        .then((res) => setUser(res.user))
        .catch(() => {
          setUser({
            id: 'guest-user-default',
            email: 'guest@newsaggregator.local',
            name: 'Guest Reader',
            role: 'guest',
          });
        });
    }
  }, []);

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['news'] });

    if (authenticatedUser.role === 'user') {
      showToast(`Welcome back, ${authenticatedUser.name || authenticatedUser.email}!`);
    } else {
      showToast('Guest session active.');
    }
  };

  const handleLogout = async () => {
    api.logout();
    const guestRes = await api.guestLogin();
    setUser(guestRes.user);
    queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    queryClient.invalidateQueries({ queryKey: ['news'] });
    showToast('Signed out. Continuing as guest reader.');
  };

  // 1. Fetch Categories
  const { data: categories = ['all', 'technology', 'business', 'science', 'health', 'politics', 'sports', 'world'] } = useQuery({
    queryKey: ['categories'],
    queryFn: api.getCategories,
    staleTime: 1000 * 60 * 30, // 30m
  });

  // 2. Fetch News Sources
  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: api.getSources,
    staleTime: 1000 * 60 * 15,
  });

  // 3. Fetch News Feed
  const {
    data: newsData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['news', filters],
    queryFn: () => api.getNews(filters),
    staleTime: 1000 * 60 * 2,
  });

  // 4. Fetch Bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: api.getBookmarks,
  });

  // 5. System Health Telemetry
  const { data: healthData } = useQuery({
    queryKey: ['health'],
    queryFn: api.checkHealth,
    refetchInterval: 30000,
  });

  // Mutations
  const toggleBookmarkMutation = useMutation({
    mutationFn: async (articleId: string) => {
      const isAlready = bookmarks.some((b) => b.id === articleId);
      if (isAlready) {
        await api.removeBookmark(articleId);
      } else {
        await api.addBookmark(articleId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
    },
  });

  const refreshNewsMutation = useMutation({
    mutationFn: async () => {
      // 1. Immediately invalidate current feed cache and refetch to refresh UI
      await queryClient.invalidateQueries({ queryKey: ['news'] });
      await refetch();

      // 2. Trigger fresh background ingestion from live news feeds
      try {
        await api.triggerIngest(filters.category !== 'all' ? filters.category : undefined);
      } catch (err: any) {
        console.warn('Background feed ingestion notice:', err?.message || err);
      }

      // 3. Invalidate again so newly ingested stories appear
      await queryClient.invalidateQueries({ queryKey: ['news'] });
      await queryClient.invalidateQueries({ queryKey: ['sources'] });
      await refetch();
    },
    onSuccess: () => {
      showToast('Feed refreshed with the latest stories!');
    },
    onError: (err: any) => {
      console.warn('Feed refresh error:', err);
      refetch();
      showToast('Feed refreshed from latest database records.');
    },
  });

  // Handlers
  const handleSelectCategory = (cat: string) => {
    setFilters((prev) => ({ ...prev, category: cat, page: 1 }));
  };

  const handleSearchChange = (q: string) => {
    setFilters((prev) => ({ ...prev, search: q, page: 1 }));
  };

  const handleFilterUpdate = (updates: Partial<NewsFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      search: '',
      sourceId: '',
      sortBy: 'publishedAt',
      order: 'desc',
      page: 1,
      limit: 12,
    });
  };

  const articles = newsData?.articles || [];
  const totalArticles = newsData?.total || 0;
  const totalPages = newsData?.totalPages || 1;
  const featuredArticle = filters.category === 'all' && !filters.search && filters.page === 1 && articles.length > 0 ? articles[0] : null;
  const feedArticles = featuredArticle ? articles.slice(1) : articles;

  const bookmarkedSet = new Set(bookmarks.map((b) => b.id));

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 flex flex-col font-sans">
      {/* Navbar */}
      <Navbar
        activeCategory={filters.category}
        onSelectCategory={handleSelectCategory}
        categories={categories}
        searchQuery={filters.search}
        onSearchChange={handleSearchChange}
        onRefreshNews={() => refreshNewsMutation.mutate()}
        isRefreshing={refreshNewsMutation.isPending || isFetching}
        bookmarkCount={bookmarks.length}
        onOpenBookmarks={() => setIsBookmarkDrawerOpen(true)}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        systemStatus={{
          healthy: healthData?.status === 'healthy',
          cachingMode: healthData?.services?.caching?.mode || 'memory',
          nlpEngine: healthData?.services?.nlpService?.fallbackActive ? 'Resilient Rule-Based' : 'HuggingFace BERT',
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Error Banner */}
        {isError && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-sm">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Failed to fetch news feed: {(error as any)?.message || 'Network request failed.'}</span>
            </div>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Lead Featured Story (Hero on page 1 of All) */}
        {!isLoading && featuredArticle && (
          <FeaturedHeadline
            article={featuredArticle}
            onOpenAnalysis={(art) => setSelectedArticle(art)}
            isBookmarked={bookmarkedSet.has(featuredArticle.id)}
            onToggleBookmark={(id) => toggleBookmarkMutation.mutate(id)}
          />
        )}

        {/* Filter Controls Bar */}
        <NewsFilterBar
          filters={filters}
          onFilterChange={handleFilterUpdate}
          onResetFilters={handleResetFilters}
          sources={sources}
          totalResults={totalArticles}
        />

        {/* News Grid / Loading / Empty */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : feedArticles.length === 0 ? (
          <EmptyState
            title="No matching articles found"
            description="No news items match your current filter parameters or search keywords."
            onReset={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedArticles.map((article) => (
              <ArticleCard
                key={article.id}
                article={article}
                onOpenAnalysis={(art) => setSelectedArticle(art)}
                isBookmarked={bookmarkedSet.has(article.id)}
                onToggleBookmark={(id) => toggleBookmarkMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="mt-10 py-4 flex items-center justify-between border-t border-slate-200 text-xs text-slate-600">
            <div>
              Page <strong className="text-slate-900">{filters.page}</strong> of <strong className="text-slate-900">{totalPages}</strong>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleFilterUpdate({ page: Math.max(1, filters.page - 1) })}
                disabled={filters.page <= 1}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <button
                onClick={() => handleFilterUpdate({ page: Math.min(totalPages, filters.page + 1) })}
                disabled={filters.page >= totalPages}
                className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Detail Analysis Modal */}
      {selectedArticle && (
        <ArticleDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onToggleBookmark={(id) => toggleBookmarkMutation.mutate(id)}
          isBookmarked={bookmarkedSet.has(selectedArticle.id)}
        />
      )}

      {/* Bookmarks Drawer */}
      <BookmarkDrawer
        isOpen={isBookmarkDrawerOpen}
        onClose={() => setIsBookmarkDrawerOpen(false)}
        bookmarks={bookmarks}
        onRemoveBookmark={(id) => toggleBookmarkMutation.mutate(id)}
        onOpenArticle={(art) => setSelectedArticle(art)}
      />

      {/* User & Guest Login Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 text-sm transition-all duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
