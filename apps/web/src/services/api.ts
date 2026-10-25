import axios from 'axios';
import { Article, ArticleAnalysis, AuthResponse, NewsFeedResponse, NewsFilterState, NewsSource, User } from '../types';

const apiBase = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api` 
  : '/api';

const apiClient = axios.create({
  baseURL: apiBase,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT token or Guest Session ID
apiClient.interceptors.request.use((reqConfig) => {
  const token = localStorage.getItem('news_auth_token');
  const guestId = localStorage.getItem('news_guest_id');

  if (token) {
    reqConfig.headers.Authorization = `Bearer ${token}`;
  } else if (guestId) {
    reqConfig.headers['x-user-id'] = guestId;
  }
  return reqConfig;
});

export const api = {
  async getNews(filters: Partial<NewsFilterState>): Promise<NewsFeedResponse> {
    const params: Record<string, any> = {
      page: filters.page || 1,
      limit: filters.limit || 12,
      category: filters.category && filters.category !== 'all' ? filters.category : undefined,
      sourceId: filters.sourceId || undefined,
      search: filters.search && filters.search.trim() ? filters.search.trim() : undefined,
      sortBy: filters.sortBy || 'publishedAt',
      order: filters.order || 'desc',
      minReadability: filters.minReadability,
      sentiment: filters.sentiment,
      biasLevel: filters.biasLevel,
    };

    const res = await apiClient.get<NewsFeedResponse>('/news', { params });
    return res.data;
  },

  async getLatest(): Promise<NewsFeedResponse> {
    const res = await apiClient.get<NewsFeedResponse>('/news/latest');
    return res.data;
  },

  async getArticleById(id: string): Promise<Article> {
    const res = await apiClient.get<{ article: Article }>(`/news/${id}`);
    return res.data.article;
  },

  async getCategories(): Promise<string[]> {
    const res = await apiClient.get<{ categories: string[] }>('/categories');
    return res.data.categories;
  },

  async getSources(): Promise<NewsSource[]> {
    const res = await apiClient.get<{ sources: NewsSource[] }>('/sources');
    return res.data.sources;
  },

  async getArticleAnalysis(id: string): Promise<ArticleAnalysis> {
    const res = await apiClient.get<{ analysis: ArticleAnalysis }>(`/news/${id}/analysis`);
    return res.data.analysis;
  },

  async analyzeArticle(id: string): Promise<ArticleAnalysis> {
    const res = await apiClient.post<{ analysis: ArticleAnalysis }>(`/news/${id}/analyze`);
    return res.data.analysis;
  },

  async triggerIngest(category?: string): Promise<{ message: string; stats?: any; status?: string }> {
    const res = await apiClient.post('/news/ingest', null, {
      params: category && category !== 'all' ? { category } : undefined,
    });
    return res.data;
  },

  async getBookmarks(): Promise<Article[]> {
    const res = await apiClient.get<{ bookmarks: Article[] }>('/bookmarks');
    return res.data.bookmarks;
  },

  async addBookmark(articleId: string): Promise<void> {
    await apiClient.post('/bookmarks', { articleId });
  },

  async removeBookmark(articleId: string): Promise<void> {
    await apiClient.delete(`/bookmarks/${articleId}`);
  },

  async checkHealth(): Promise<any> {
    const res = await axios.get('/health');
    return res.data;
  },

  // Authentication & Session
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (res.data.token) {
      localStorage.setItem('news_auth_token', res.data.token);
      localStorage.removeItem('news_guest_id');
    }
    return res.data;
  },

  async register(data: { email: string; password: string; name?: string }): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    if (res.data.token) {
      localStorage.setItem('news_auth_token', res.data.token);
      localStorage.removeItem('news_guest_id');
    }
    return res.data;
  },

  async guestLogin(guestId?: string): Promise<AuthResponse> {
    const res = await apiClient.post<AuthResponse>('/auth/guest', { guestId });
    if (res.data.guestId) {
      localStorage.setItem('news_guest_id', res.data.guestId);
      localStorage.removeItem('news_auth_token');
    }
    return res.data;
  },

  async getCurrentUser(): Promise<User> {
    const res = await apiClient.get<{ user: User }>('/auth/me');
    return res.data.user;
  },

  logout(): void {
    localStorage.removeItem('news_auth_token');
  },
};
