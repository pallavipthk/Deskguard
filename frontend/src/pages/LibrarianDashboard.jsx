import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext.jsx';
import { DeskMap } from '../components/DeskMap.jsx';
import { DeskModal } from '../components/DeskModal.jsx';
import api from '../utils/api.js';
import { Search, ShieldAlert, LogOut, ArrowRight, UserCheck, HelpCircle } from 'lucide-react';

export const LibrarianDashboard = () => {
  const socket = useSocket();

  const [desks, setDesks] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesk, setSelectedDesk] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDesks();
    fetchActiveSessions();
  }, []);

  // Sync WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handleDeskUpdate = () => {
      fetchDesks();
      fetchActiveSessions();
    };

    socket.on('desk_update', handleDeskUpdate);

    return () => {
      socket.off('desk_update', handleDeskUpdate);
    };
  }, [socket]);

  const fetchDesks = async () => {
    try {
      const res = await api.get('/desks');
      setDesks(res.data);
    } catch (err) {
      console.error('Error fetching desks:', err);
    }
  };

  const fetchActiveSessions = async () => {
    try {
      const res = await api.get('/sessions/librarian/active');
      setActiveSessions(res.data);
    } catch (err) {
      console.error('Error fetching active sessions:', err);
    }
  };

  const handleForceRelease = async (deskId) => {
    setLoading(true);
    try {
      const res = await api.post(`/desks/${deskId}/force-release`);
      setMessage(res.data.message);
      fetchDesks();
      fetchActiveSessions();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Error force releasing desk:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeskClick = (desk) => {
    setSelectedDesk(desk);
    setIsModalOpen(true);
  };

  // Filter desks by search input (matches desk ID, zone, occupant username or occupant email)
  const filteredDesks = desks.filter(d => {
    const session = activeSessions.find(s => s.desk_id === d.id);
    const searchLower = searchTerm.toLowerCase();

    const matchesDeskId = d.id.toLowerCase().includes(searchLower);
    const matchesDeskName = d.name.toLowerCase().includes(searchLower);
    const matchesDeskZone = d.zone.toLowerCase().includes(searchLower);
    const matchesOccupantName = session?.username?.toLowerCase().includes(searchLower) || false;
    const matchesOccupantEmail = session?.email?.toLowerCase().includes(searchLower) || false;

    return matchesDeskId || matchesDeskName || matchesDeskZone || matchesOccupantName || matchesOccupantEmail;
  });

  const awayCount = desks.filter(d => d.status === 'away').length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      
      {/* Alerts */}
      {message && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold shadow-xl">
          ✓ {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Librarian Control Cockpit
          </h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Oversee seat bookings, search active student files, and force release hoarded/abandoned desks.
          </p>
        </div>
        {awayCount > 0 && (
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 text-amber-500 animate-pulse">
            <ShieldAlert className="h-5 w-5" />
            <span className="text-xs font-bold">{awayCount} desks currently on Away timer</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 Cols): Search bar & Desks status table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Table Card */}
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl">
            
            {/* Table Search Header */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                Library Inventory ({filteredDesks.length} seats)
              </h2>
              
              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search desk, zone or student..."
                  className="block w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-slate-100 text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Desks Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4">Desk</th>
                    <th className="py-3 px-4">Zone</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Occupant</th>
                    <th className="py-3 px-4">Checked In</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 text-xs font-semibold">
                  {filteredDesks.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-400 dark:text-slate-500">
                        No desks found matching query
                      </td>
                    </tr>
                  ) : (
                    filteredDesks.map(desk => {
                      const session = activeSessions.find(s => s.desk_id === desk.id);
                      return (
                        <tr 
                          key={desk.id} 
                          className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {desk.id}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                            {desk.zone}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                              desk.status === 'available'
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                                : desk.status === 'away'
                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse'
                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                            }`}>
                              {desk.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-slate-300">
                            {session ? (
                              <div className="flex flex-col">
                                <span>{session.username}</span>
                                <span className="text-[9px] text-slate-400 font-semibold">{session.email}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-normal">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400">
                            {session ? (
                              new Date(session.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {desk.status !== 'available' ? (
                              <button
                                onClick={() => handleForceRelease(desk.id)}
                                disabled={loading}
                                className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors"
                              >
                                <LogOut className="h-3 w-3" />
                                <span>Release</span>
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-semibold px-3 py-1.5 inline-block">Free</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

        {/* Right Column (1 Col): Interactive Floor Map */}
        <div className="space-y-6">
          
          <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
              <span>Map Helper view</span>
              <UserCheck className="h-4 w-4 text-slate-400" />
            </h3>
            <DeskMap desks={desks} onDeskClick={handleDeskClick} />
          </div>

        </div>

      </div>

      {/* Details Modal */}
      {selectedDesk && (
        <DeskModal
          desk={selectedDesk}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedDesk(null);
          }}
          onActionSuccess={(msg) => {
            setMessage(msg);
            fetchDesks();
            fetchActiveSessions();
            setTimeout(() => setMessage(''), 3000);
          }}
        />
      )}

    </div>
  );
};
