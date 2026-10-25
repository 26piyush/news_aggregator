import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, ArrowRight, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        if (!email || !password) {
          setError('Please provide both email and password.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          setLoading(false);
          return;
        }
        const res = await api.register({ email, password, name: name.trim() || undefined });
        onAuthSuccess(res.user);
        onClose();
      } else {
        if (!email || !password) {
          setError('Please enter your email and password.');
          setLoading(false);
          return;
        }
        const res = await api.login({ email, password });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || 'Authentication failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await api.guestLogin();
      onAuthSuccess(res.user);
      onClose();
    } catch (err: any) {
      setError('Could not initialize guest session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setEmail('reader@news.ai');
    setPassword('password123');
    setError(null);
    setLoading(true);
    try {
      // Try login first; if not registered yet, register
      try {
        const res = await api.login({ email: 'reader@news.ai', password: 'password123' });
        onAuthSuccess(res.user);
        onClose();
      } catch {
        const res = await api.register({ email: 'reader@news.ai', password: 'password123', name: 'Demo Reader' });
        onAuthSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="relative px-6 pt-6 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-2 px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs font-semibold rounded-full mb-3 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI News Reader Account</span>
          </div>

          <h2 className="text-xl font-bold tracking-tight">
            {mode === 'login' ? 'Welcome Back' : 'Create an Account'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {mode === 'login' 
              ? 'Sign in to sync your saved reading list and bookmarks across devices.'
              : 'Join to save favorite publishers, articles, and reading history in the cloud.'}
          </p>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl mt-4 border border-slate-700/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              {mode === 'register' && (
                <span className="text-[11px] text-slate-400 mt-1 block">At least 6 characters</span>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={handleQuickDemo}
              className="text-[11px] font-medium text-blue-600 hover:text-blue-800 transition underline underline-offset-2"
            >
              One-Click Demo Account (reader@news.ai)
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium tracking-wider">or</span>
            </div>
          </div>

          {/* Guest Login Option */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
            <p className="text-xs text-slate-600 font-medium mb-2.5">
              Want to explore first without registering?
            </p>
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 font-medium text-xs rounded-xl border border-slate-300 shadow-sm transition flex items-center justify-center space-x-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Continue as Guest</span>
            </button>
            <span className="text-[10px] text-slate-400 mt-1.5 block">
              Session bookmarks are saved locally to this device.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
