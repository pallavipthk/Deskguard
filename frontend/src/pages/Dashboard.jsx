import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSocket } from '../context/SocketContext.jsx';
import { StatsCards } from '../components/StatsCards.jsx';
import { DeskMap } from '../components/DeskMap.jsx';
import { DeskModal } from '../components/DeskModal.jsx';
import api from '../utils/api.js';
import { Clock, ShieldAlert, Award, Calendar, RefreshCw, LogOut, Coffee, ArrowRight, Play } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Dashboard = () => {
  const { user } = useAuth();
  const socket = useSocket();
  
  const [desks, setDesks] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('info'); // 'info' | 'success' | 'warn'

  // Verification prompt state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationTimeLeft, setVerificationTimeLeft] = useState(300); // 5 minutes in seconds

  // Live timer states
  const [sessionTimeStr, setSessionTimeStr] = useState('00:00:00');
  const [awayTimeStr, setAwayTimeStr] = useState('20:00');

  const timerIntervalRef = useRef(null);

  // Fetch desks and student active session on load
  useEffect(() => {
    fetchDesks();
    fetchActiveSession();
    fetchHistory();
  }, []);

  // Set up WebSocket listeners for real-time seat color changes
  useEffect(() => {
    if (!socket) return;

    const handleDeskUpdate = (data) => {
      // 1. Update the local desks list
      setDesks(prevDesks => 
        prevDesks.map(d => {
          if (d.id === data.deskId) {
            return { ...d, status: data.status, current_session_id: data.currentSessionId };
          }
          return d;
        })
      );

      // 2. If it affects the logged-in student's active session, refresh active session details
      fetchActiveSession();
    };

    socket.on('desk_update', handleDeskUpdate);

    return () => {
      socket.off('desk_update', handleDeskUpdate);
    };
  }, [socket]);

  // Set up heartbeat pings and live timers
  useEffect(() => {
    // A. Heartbeat ping running every 30 seconds
    const pingInterval = setInterval(() => {
      sendHeartbeatPing();
    }, 30000);

    // B. Clock tick running every 1 second
    timerIntervalRef.current = setInterval(() => {
      tickTimers();
    }, 1000);

    return () => {
      clearInterval(pingInterval);
      clearInterval(timerIntervalRef.current);
    };
  }, [activeSession]);

  const fetchDesks = async () => {
    try {
      const res = await api.get('/desks');
      setDesks(res.data);
    } catch (err) {
      console.error('Error fetching desks:', err);
    }
  };

  const fetchActiveSession = async () => {
    try {
      const res = await api.get('/sessions/active');
      const session = res.data.session;
      setActiveSession(session);
      
      // Auto-trigger verification modal if server flags pending verification
      if (session && session.verification_pending_at) {
        setShowVerificationModal(true);
      } else {
        setShowVerificationModal(false);
      }
    } catch (err) {
      console.error('Error fetching active session:', err);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get('/sessions/history');
      setHistory(res.data);
    } catch (err) {
      console.error('Error fetching session history:', err);
    }
  };

  const sendHeartbeatPing = async () => {
    if (!activeSession) return;
    try {
      const res = await api.post('/sessions/ping');
      if (res.data.status === 'ping_acknowledged' && res.data.verificationPendingAt) {
        setShowVerificationModal(true);
      } else {
        setShowVerificationModal(false);
      }
    } catch (err) {
      console.error('Heartbeat ping error:', err);
    }
  };

  const tickTimers = () => {
    if (!activeSession) return;

    const now = new Date();

    // 1. Session Duration Countup (checked_in_at -> now)
    const checkInTime = new Date(activeSession.checked_in_at);
    const durationMs = now.getTime() - checkInTime.getTime();
    if (durationMs > 0) {
      const totalSecs = Math.floor(durationMs / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      setSessionTimeStr(
        `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }

    // 2. Away Countdown Timer (away_started_at + 20m -> now)
    if (activeSession.status === 'away' && activeSession.away_started_at) {
      const awayStart = new Date(activeSession.away_started_at);
      const awayLimitMs = 20 * 60 * 1000;
      const timeElapsed = now.getTime() - awayStart.getTime();
      const timeRemainingMs = awayLimitMs - timeElapsed;

      if (timeRemainingMs > 0) {
        const remSecs = Math.floor(timeRemainingMs / 1000);
        const mins = Math.floor(remSecs / 60);
        const secs = remSecs % 60;
        setAwayTimeStr(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else {
        setAwayTimeStr('00:00');
      }
    }

    // 3. Auto-Abandon Presence Check Countdown (verification_pending_at + 5m -> now)
    if (showVerificationModal && activeSession.verification_pending_at) {
      const pendingTime = new Date(activeSession.verification_pending_at);
      const graceLimitMs = 5 * 60 * 1000;
      const timeElapsed = now.getTime() - pendingTime.getTime();
      const timeRemainingMs = graceLimitMs - timeElapsed;

      if (timeRemainingMs > 0) {
        setVerificationTimeLeft(Math.floor(timeRemainingMs / 1000));
      } else {
        setVerificationTimeLeft(0);
        setShowVerificationModal(false);
      }
    }
  };

  const handleVerifyPresence = async () => {
    try {
      await api.post('/sessions/verify-presence');
      setShowVerificationModal(false);
      
      // Blast celebratory confetti on success
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      triggerToast('Presence verified! Session extended.', 'success');
      fetchActiveSession();
    } catch (err) {
      console.error('Error verifying presence:', err);
      triggerToast('Presence verification failed. Try again.', 'warn');
    }
  };

  const triggerToast = (msg, type = 'info') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  const handleDeskClick = (desk) => {
    setSelectedDesk(desk);
    setIsModalOpen(true);
  };

  const handleCheckout = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/desks/${activeSession.desk_id}/checkout`);
      triggerToast('Checked out of desk successfully.', 'success');
      fetchActiveSession();
      fetchDesks();
      fetchHistory();
    } catch (err) {
      triggerToast('Failed to check out.', 'warn');
    }
  };

  const handleSetAway = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/desks/${activeSession.desk_id}/away`);
      triggerToast('Away mode activated. You have 20 minutes to return.', 'info');
      fetchActiveSession();
      fetchDesks();
    } catch (err) {
      triggerToast('Failed to set Away.', 'warn');
    }
  };

  const handleSetBack = async () => {
    if (!activeSession) return;
    try {
      await api.post(`/desks/${activeSession.desk_id}/back`);
      triggerToast('Welcome back! Session extended.', 'success');
      fetchActiveSession();
      fetchDesks();
    } catch (err) {
      triggerToast('Failed to resume session.', 'warn');
    }
  };

  // Evaluation tool helper
  const handleSimulateTest = async (testType) => {
    if (!activeSession) {
      return triggerToast('You must have an active booking to run tests.', 'warn');
    }
    try {
      triggerToast(`Simulating ${testType.replace('_', ' ')}...`, 'info');
      const res = await api.post('/sessions/test-trigger', { type: testType });
      triggerToast(res.data.message, 'success');
      
      // Reload states
      await fetchActiveSession();
      await fetchDesks();
    } catch (err) {
      triggerToast(err.response?.data?.error || 'Simulating error.', 'warn');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12 relative">
      
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl border shadow-xl flex items-center space-x-3 text-xs font-semibold animate-[bounce_0.5s_ease-out] ${
          toastType === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            : toastType === 'warn'
            ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
            : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400'
        }`}>
          <span>{toastType === 'success' ? '✓' : toastType === 'warn' ? '⚠' : 'ℹ'}</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hero Welcome banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Hi, {user?.username || 'Student'}!
          </h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Reserve quiet zones, monitor peak hours, and check in via desk QR plates.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-xl px-4.5 py-2">
          <Award className="h-5 w-5 text-emerald-500" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">Hoarding protection active</span>
        </div>
      </div>

      {/* Real-time stats cards */}
      <StatsCards desks={desks} abandonedCount={history.filter(h => h.status === 'abandoned').length} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left/Middle: SVG Floor Map */}
        <div className="lg:col-span-2">
          <DeskMap desks={desks} onDeskClick={handleDeskClick} />
        </div>

        {/* Right: Active booking panel & history */}
        <div className="space-y-6">
          
          {/* Active Booking card */}
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            {/* Glowing active glow border */}
            {activeSession && (
              <div className={`absolute inset-0 border-t-2 -z-10 ${
                activeSession.status === 'away' ? 'border-amber-500/50' : 'border-emerald-500/50'
              }`}></div>
            )}

            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>My Active Booking</span>
              {activeSession && (
                <span className={`h-2.5 w-2.5 rounded-full ${activeSession.status === 'away' ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
              )}
            </h3>

            {activeSession ? (
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-black text-slate-800 dark:text-white">
                    {activeSession.desk_name}
                  </h4>
                  <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">{activeSession.desk_zone}</p>
                </div>

                {/* Session Timers Display */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* General Clockup */}
                  <div className="bg-slate-50 dark:bg-slate-800/35 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Session Time
                    </span>
                    <span className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Clock className="h-4.5 w-4.5 text-slate-400" />
                      {sessionTimeStr}
                    </span>
                  </div>

                  {/* Away Countdown (Shown only if away) */}
                  {activeSession.status === 'away' ? (
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 animate-pulse">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 block mb-1">
                        Away Left
                      </span>
                      <span className="text-lg font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                        <Coffee className="h-4.5 w-4.5" />
                        {awayTimeStr}
                      </span>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/35 border border-slate-100 dark:border-slate-800 rounded-2xl p-4">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Away Buffer
                      </span>
                      <span className="text-xs text-slate-500 font-bold block mt-1 leading-normal">
                        20 mins max per leave
                      </span>
                    </div>
                  )}

                </div>

                {/* Main Operations Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {activeSession.status === 'away' ? (
                    <button
                      onClick={handleSetBack}
                      className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-neon-green"
                    >
                      <Play className="h-4 w-4" />
                      <span>Resume</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleSetAway}
                      className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
                    >
                      <Coffee className="h-4 w-4" />
                      <span>Set Away</span>
                    </button>
                  )}
                  <button
                    onClick={handleCheckout}
                    className="flex items-center justify-center space-x-2 py-3 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Check Out</span>
                  </button>
                </div>

                {/* Hackathon Evaluation Console Box */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 p-3.5 rounded-2xl">
                  <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest text-center mb-2.5">
                    ⚙️ Test Simulator console (Fast-Forward Timers)
                  </p>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleSimulateTest('verification_prompt')}
                      className="py-1.5 px-3 text-[10px] text-left rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-500 dark:text-indigo-400 transition-all font-semibold"
                    >
                      🕒 Simulate 2-hour stay ("Still Here?")
                    </button>
                    <button
                      onClick={() => handleSimulateTest('away_timeout')}
                      className="py-1.5 px-3 text-[10px] text-left rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 dark:text-amber-400 transition-all font-semibold"
                    >
                      ☕ Simulate 20-min Away Expiry
                    </button>
                    <button
                      onClick={() => handleSimulateTest('grace_timeout')}
                      className="py-1.5 px-3 text-[10px] text-left rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 dark:text-rose-400 transition-all font-semibold"
                    >
                      ⏳ Simulate 5-min grace timeout (No response)
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 space-y-4">
                <p>You do not have any active desk reservations.</p>
                <p className="text-[10px] text-slate-500 leading-normal max-w-xs mx-auto">
                  Scan a desk QR code or click a green desk on the floor map to book your study workspace.
                </p>
              </div>
            )}
          </div>

          {/* History log card */}
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>My Booking History</span>
              <Calendar className="h-4 w-4 text-slate-400" />
            </h3>
            <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
              {history.length === 0 ? (
                <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                  No reservation records yet
                </p>
              ) : (
                history.map(h => (
                  <div
                    key={h.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/20 border border-slate-100 dark:border-slate-800 text-xs flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200">{h.desk_name}</p>
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        {new Date(h.checked_in_at).toLocaleDateString()} at{' '}
                        {new Date(h.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      h.status === 'completed'
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        : h.status === 'abandoned'
                        ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                    }`}>
                      {h.status === 'completed' ? 'Released' : h.status === 'abandoned' ? 'Hoarded' : 'Active'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* FLOOR MAP DESK OVERLAY MODAL */}
      {selectedDesk && (
        <DeskModal
          desk={selectedDesk}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDesk(null);
          }}
          onActionSuccess={(msg) => {
            triggerToast(msg, 'success');
            fetchDesks();
            fetchActiveSession();
            fetchHistory();
          }}
        />
      )}

      {/* FLOATING "STILL HERE?" PRESENCE CHECK MODAL */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
          <div className="relative w-full max-w-sm rounded-3xl border border-red-500/30 bg-white dark:bg-slate-900 shadow-2xl p-6 md:p-8 text-center animate-bounce-slow">
            
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 shadow-neon-red mb-4 animate-pulse">
              <ShieldAlert className="h-6 w-6" />
            </div>

            <h3 className="text-xl font-black text-slate-800 dark:text-white">Are you still here?</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium leading-relaxed">
              Anti-Hoarding protocol activated. Confirm you are still studying at your desk, or the system will automatically release it.
            </p>

            {/* Verification timer countdown circle */}
            <div className="my-6">
              <div className="inline-block p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                  Time Remaining
                </span>
                <span className="text-3xl font-black text-red-500 tracking-wider">
                  {Math.floor(verificationTimeLeft / 60)}:
                  {String(verificationTimeLeft % 60).padStart(2, '0')}
                </span>
              </div>
            </div>

            <button
              onClick={handleVerifyPresence}
              className="flex items-center justify-center w-full py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-neon-green hover:shadow-emerald-500/40 hover:-translate-y-0.5 transform transition-all duration-300"
            >
              Yes, I'm still studying!
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
