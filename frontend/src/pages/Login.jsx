import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, User, Lock, ArrowRight } from 'lucide-react';

export const Login = ({ onRegisterClick }) => {
  const { login } = useAuth();
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !password) {
      return setError('Please fill in all credentials fields.');
    }

    setLoading(true);
    setError('');
    const result = await login(loginIdentifier, password);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
  };

  const handleQuickLogin = (user, pass) => {
    setLoginIdentifier(user);
    setPassword(pass);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-slate-900/10 dark:bg-slate-950/20 px-4 py-12">
      {/* Background glowing gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-3xl -z-10"></div>

      <div className="w-full max-w-md">
        
        {/* Logo and Intro */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-neon-green mb-4">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-800 dark:text-white">
            Welcome to <span className="bg-gradient-to-r from-emerald-500 to-teal-400 bg-clip-text text-transparent">DeskGuard</span>
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Prevent seat hoarding. Study fair.</p>
        </div>

        {/* Login Glass Form */}
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-2xl relative">
          
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-500 leading-normal">
                {error}
              </div>
            )}

            {/* Username/Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username or Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="alex_student or alex@library.edu"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center space-x-2 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-neon-green hover:shadow-emerald-500/40 hover:-translate-y-0.5 transform transition-all duration-300"
            >
              <span>{loading ? 'Authenticating account...' : 'Sign In'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

          </form>

          {/* Quick Pre-fills (Amazing Hackathon Dev Feature) */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800/80">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              Hackathon Demo Quick Accounts
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleQuickLogin('alex_student', 'student123')}
                className="py-2 px-3 text-[10px] text-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/5 hover:border-emerald-500/25 transition-all font-semibold"
              >
                🎓 Student Account
              </button>
              <button
                onClick={() => handleQuickLogin('sarah_librarian', 'librarian123')}
                className="py-2 px-3 text-[10px] text-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-emerald-500/5 hover:border-emerald-500/25 transition-all font-semibold"
              >
                🔑 Librarian Account
              </button>
            </div>
          </div>

          {/* Redirect to signup */}
          <div className="text-center mt-6">
            <button
              onClick={onRegisterClick}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              Don't have an account? <span className="text-emerald-500">Sign up</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
