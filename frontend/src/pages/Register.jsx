import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { BookOpen, User, Mail, Lock, Shield, ArrowRight } from 'lucide-react';

export const Register = ({ onLoginClick }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      return setError('Please fill in all registration fields.');
    }

    setLoading(true);
    setError('');
    const result = await register(username, email, password, role);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
    }
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
            Join DeskGuard
          </h2>
          <p className="text-sm text-slate-400 font-medium mt-2">Initialize your student profile to reserve study space.</p>
        </div>

        {/* Register Glass Form */}
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-8 shadow-2xl relative">
          
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-xs text-red-500 leading-normal">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="jack_99"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">School Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jack@library.edu"
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
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
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-sm placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Role selection */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Role Privilege</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Shield className="h-4 w-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                >
                  <option value="student">🎓 Student</option>
                  <option value="librarian">🔑 Librarian Staff</option>
                </select>
              </div>
            </div>

            {/* Register button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center space-x-2 w-full py-3.5 mt-2 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-neon-green hover:shadow-emerald-500/40 hover:-translate-y-0.5 transform transition-all duration-300"
            >
              <span>{loading ? 'Creating profile...' : 'Create Account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

          </form>

          {/* Redirect to login */}
          <div className="text-center mt-6">
            <button
              onClick={onLoginClick}
              className="text-xs font-semibold text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
            >
              Already have an account? <span className="text-emerald-500">Sign in</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
