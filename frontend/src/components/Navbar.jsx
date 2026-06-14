import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import api from '../utils/api.js';
import { Sun, Moon, Bell, LogOut, Shield, Map, BarChart2, BookOpen, Menu, X } from 'lucide-react';

export const Navbar = ({ currentTab, setCurrentTab }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const socket = useSocket();
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch initial notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications(prev => [
        {
          id: Date.now(),
          message: notif.message,
          type: notif.type,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...prev
      ]);
      setUnreadCount(prev => prev + 1);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.is_read).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markNotificationsAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await api.post('/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  const toggleNotifDropdown = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
      markNotificationsAsRead();
    }
  };

  const isLibrarianOrAdmin = user?.role === 'librarian' || user?.role === 'admin';

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full px-6 py-4 shadow-lg backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-neon-green">
            <BookOpen className="h-6 w-6" />
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 opacity-30 blur"></div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-wider bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent dark:from-emerald-300 dark:to-teal-200">
              DESK<span className="text-slate-800 dark:text-white font-medium">GUARD</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-widest uppercase">Smart Allocation</p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              currentTab === 'dashboard'
                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400'
            }`}
          >
            <Map className="h-4 w-4" />
            <span>Map & Booking</span>
          </button>

          <button
            onClick={() => setCurrentTab('analytics')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
              currentTab === 'analytics'
                ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-300'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400'
            }`}
          >
            <BarChart2 className="h-4 w-4" />
            <span>Analytics</span>
          </button>

          {isLibrarianOrAdmin && (
            <button
              onClick={() => setCurrentTab('librarian')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-300 ${
                currentTab === 'librarian'
                  ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-400/15 dark:text-emerald-300'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Librarian Cockpit</span>
            </button>
          )}
        </div>

        {/* Actions panel */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Light/Dark Toggle */}
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4.5 w-4.5 text-yellow-400" /> : <Moon className="h-4.5 w-4.5 text-indigo-500" />}
          </button>

          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={toggleNotifDropdown}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300"
            >
              <Bell className="h-4.5 w-4.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-neon-red animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown Tray */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-2 z-50">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-3 py-2">
                  <span className="font-bold text-xs text-slate-700 dark:text-slate-200">System Activity</span>
                  <span className="text-[10px] text-emerald-500 font-semibold">Real-time alerts</span>
                </div>
                <div className="max-h-60 overflow-y-auto mt-2 space-y-1">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`p-2.5 rounded-lg text-xs leading-relaxed border-l-2 ${
                          n.type === 'alert'
                            ? 'bg-red-500/5 border-red-500 text-red-700 dark:text-red-400'
                            : n.type === 'warning'
                            ? 'bg-amber-500/5 border-amber-500 text-amber-700 dark:text-amber-400'
                            : 'bg-emerald-500/5 border-emerald-500 text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        <p>{n.message}</p>
                        <span className="text-[9px] opacity-60 block mt-1">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info & Logout */}
          {user && (
            <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.username}</p>
                <span className="text-[9px] font-semibold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-red-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-300"
                title="Log out"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center space-x-3 md:hidden">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
          >
            {isDark ? <Sun className="h-4 w-4 text-yellow-400" /> : <Moon className="h-4 w-4 text-indigo-500" />}
          </button>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-600 dark:text-slate-300 hover:text-emerald-500"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <button
            onClick={() => { setCurrentTab('dashboard'); setMobileMenuOpen(false); }}
            className="flex w-full items-center space-x-2 p-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <Map className="h-4 w-4" />
            <span>Map & Booking</span>
          </button>
          
          <button
            onClick={() => { setCurrentTab('analytics'); setMobileMenuOpen(false); }}
            className="flex w-full items-center space-x-2 p-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200"
          >
            <BarChart2 className="h-4 w-4" />
            <span>Analytics</span>
          </button>
          
          {isLibrarianOrAdmin && (
            <button
              onClick={() => { setCurrentTab('librarian'); setMobileMenuOpen(false); }}
              className="flex w-full items-center space-x-2 p-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              <Shield className="h-4 w-4" />
              <span>Librarian Cockpit</span>
            </button>
          )}

          {user && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{user.username}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={() => { logout(); setMobileMenuOpen(false); }}
                className="flex items-center space-x-1 text-xs text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
