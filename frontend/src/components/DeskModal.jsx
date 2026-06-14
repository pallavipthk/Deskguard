import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, QrCode, Monitor, User, ShieldAlert, CheckCircle, AlertTriangle, Play, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../utils/api.js';

export const DeskModal = ({ desk, isOpen, onClose, onActionSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [scanStep, setScanStep] = useState('detail'); // 'detail' | 'scanner' | 'success'
  const [activeSession, setActiveSession] = useState(null);

  // Fetch session details if occupied/away to show details to librarian
  useEffect(() => {
    if (isOpen && (desk.status === 'occupied' || desk.status === 'away') && desk.current_session_id) {
      fetchSessionDetails();
    } else {
      setActiveSession(null);
      setScanStep('detail');
      setError('');
    }
  }, [isOpen, desk]);

  const fetchSessionDetails = async () => {
    try {
      // Get all active sessions for librarian, or match from general fetch
      const endpoint = user.role === 'student' ? '/sessions/active' : '/sessions/librarian/active';
      const res = await api.get(endpoint);
      
      let sessionData = null;
      if (user.role === 'student') {
        sessionData = res.data.session;
      } else {
        sessionData = res.data.find(s => s.id === desk.current_session_id);
      }
      setActiveSession(sessionData);
    } catch (err) {
      console.error('Error fetching session details:', err);
    }
  };

  if (!isOpen) return null;

  const handleSimulateScan = async () => {
    setLoading(true);
    setError('');
    try {
      // Simulate scanning delay (1.2s)
      await new Promise(r => setTimeout(r, 1200));

      const res = await api.post(`/desks/${desk.id}/checkin`, {
        qrCode: desk.qr_code // pass the correct qr code to pass the verification
      });

      setScanStep('success');
      setTimeout(() => {
        onActionSuccess(res.data.message);
        onClose();
      }, 1500);

    } catch (err) {
      setError(err.response?.data?.error || 'Simulated check-in failed.');
      setScanStep('detail');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionPath) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post(`/desks/${desk.id}/${actionPath}`);
      onActionSuccess(res.data.message);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Operation failed.');
    } finally {
      setLoading(false);
    }
  };

  const isOccupant = activeSession && activeSession.user_id === user?.id;
  const isStaff = user?.role === 'librarian' || user?.role === 'admin';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-800/50 bg-white/90 dark:bg-slate-900/90 glass-panel shadow-2xl p-6 md:p-8"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* VIEW 1: DESK DETAILS */}
          {scanStep === 'detail' && (
            <div>
              {/* Header Zone & Specs */}
              <div className="mb-6">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                  {desk.zone}
                </span>
                <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-3">
                  {desk.name}
                </h3>
                <p className="text-xs text-slate-400 font-semibold mt-1">ID: {desk.id}</p>
              </div>

              {/* Error messages if any */}
              {error && (
                <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-500 leading-normal">
                  {error}
                </div>
              )}

              {/* Status Display Card */}
              <div className={`mb-6 p-4 rounded-2xl border ${
                desk.status === 'available'
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : desk.status === 'away'
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-600 dark:text-amber-400 animate-pulse'
                  : 'bg-red-500/5 border-red-500/20 text-red-600 dark:text-red-400'
              }`}>
                <div className="flex items-center space-x-3">
                  {desk.status === 'available' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : desk.status === 'away' ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <ShieldAlert className="h-5 w-5" />
                  )}
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider">
                      Seat is {desk.status}
                    </p>
                    <p className="text-[11px] opacity-75 mt-0.5 font-medium leading-relaxed">
                      {desk.status === 'available'
                        ? 'This seat is free to use. Scan the QR code at the desk to claim it.'
                        : desk.status === 'away'
                        ? 'The occupant has temporarily stepped away (20m limit).'
                        : 'Seat is currently checked-in and active.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Active session details (especially for Librarians) */}
              {activeSession && (
                <div className="mb-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Occupant:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                      <User className="h-3.5 w-3.5" />
                      {activeSession.username || `User #${activeSession.user_id}`}
                    </span>
                  </div>
                  {isStaff && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Email:</span>
                      <span className="font-semibold text-slate-500 dark:text-slate-300">{activeSession.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-medium">Checked In:</span>
                    <span className="font-semibold text-slate-500 dark:text-slate-300">
                      {new Date(activeSession.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {desk.status === 'away' && activeSession.away_started_at && (
                    <div className="flex items-center justify-between text-amber-500">
                      <span>Away Started:</span>
                      <span className="font-bold">
                        {new Date(activeSession.away_started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Context Actions */}
              <div className="flex flex-col gap-3">
                {/* 1. Student Check-In (only if available) */}
                {desk.status === 'available' && user?.role === 'student' && (
                  <button
                    onClick={() => setScanStep('scanner')}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-neon-green hover:shadow-emerald-500/40 transform hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <QrCode className="h-4.5 w-4.5" />
                    <span>Scan QR to Check In</span>
                  </button>
                )}

                {/* 2. Occupant Operations (if checked-in/occupied) */}
                {desk.status === 'occupied' && isOccupant && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAction('away')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>Set Away (20m)</span>
                    </button>
                    <button
                      onClick={() => handleAction('checkout')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Check Out</span>
                    </button>
                  </div>
                )}

                {/* 3. Occupant Operations (if Away) */}
                {desk.status === 'away' && isOccupant && (
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleAction('back')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>Check Back In</span>
                    </button>
                    <button
                      onClick={() => handleAction('checkout')}
                      disabled={loading}
                      className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Check Out</span>
                    </button>
                  </div>
                )}

                {/* 4. Staff overriding (if occupied or away, force release) */}
                {desk.status !== 'available' && isStaff && (
                  <button
                    onClick={() => handleAction('force-release')}
                    disabled={loading}
                    className="flex items-center justify-center space-x-2 w-full py-3 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 hover:shadow-neon-red transition-all duration-300"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    <span>Librarian: Force Release Seat</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* VIEW 2: SIMULATED QR CODE VIEWFINDER SCANNER */}
          {scanStep === 'scanner' && (
            <div className="flex flex-col items-center py-4 text-center">
              <div className="flex items-center space-x-2 mb-6 self-start">
                <button 
                  onClick={() => setScanStep('detail')} 
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center text-xs gap-1 font-semibold"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              </div>

              <h4 className="text-lg font-black text-slate-800 dark:text-white mb-2">Simulated QR Scanner</h4>
              <p className="text-xs text-slate-400 mb-6 font-medium max-w-xs">Scan the code stuck onto {desk.name} to complete your verification.</p>

              {/* Scanning viewport animation box */}
              <div className="relative w-48 h-48 border-2 border-dashed border-emerald-500 rounded-3xl overflow-hidden flex items-center justify-center bg-slate-950/20 mb-8">
                {/* Neon scanning laser line animation */}
                <div className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_10px_#10b981] animate-[bounce_2s_infinite_ease-in-out]"></div>
                
                <QrCode className="h-20 w-20 text-slate-600 dark:text-slate-400 opacity-60" />
                
                {/* Frame corners styling */}
                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500 rounded-tl-md"></div>
                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500 rounded-tr-md"></div>
                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500 rounded-bl-md"></div>
                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500 rounded-br-md"></div>
              </div>

              <button
                onClick={handleSimulateScan}
                disabled={loading}
                className="flex items-center justify-center space-x-2 py-3 px-6 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors w-full"
              >
                {loading ? 'Reading QR code matrix...' : 'Simulate Camera QR Scan'}
              </button>
            </div>
          )}

          {/* VIEW 3: SCANNING SUCCESS DISPLAY */}
          {scanStep === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-neon-green mb-6 animate-bounce">
                <CheckCircle className="h-10 w-10" />
              </div>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">Check-in Complete!</h4>
              <p className="text-xs text-slate-400 mt-2 font-medium">Session initialized. Enjoy your study slot!</p>
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
