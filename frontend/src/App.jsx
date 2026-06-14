import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { LibrarianDashboard } from './pages/LibrarianDashboard.jsx';
import { Analytics } from './pages/Analytics.jsx';
import { Navbar } from './components/Navbar.jsx';
import { motion, AnimatePresence } from 'framer-motion';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard' | 'librarian' | 'analytics'

  // Loading view
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 text-emerald-400 font-extrabold text-sm tracking-widest uppercase">
        Initializing DeskGuard Core Security...
      </div>
    );
  }

  // Authentication screens
  if (!user) {
    return authView === 'login' ? (
      <Login onRegisterClick={() => setAuthView('register')} />
    ) : (
      <Register onLoginClick={() => setAuthView('login')} />
    );
  }

  // Page switcher mapping with transition configurations
  const renderTabContent = () => {
    switch (currentTab) {
      case 'librarian':
        return <LibrarianDashboard />;
      case 'analytics':
        return <Analytics />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen w-full transition-colors duration-300 bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 pb-20 relative">
      
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-emerald-500/5 dark:bg-emerald-500/3 blur-3xl -z-10 animate-[pulse-slow_6s_infinite]"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-500/5 dark:bg-teal-500/3 blur-3xl -z-10 animate-[pulse-slow_4s_infinite]"></div>

      {/* Shared Navigation Header */}
      <Navbar currentTab={currentTab} setCurrentTab={setCurrentTab} />

      {/* Main Page Content Area with motion transitions */}
      <main className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
