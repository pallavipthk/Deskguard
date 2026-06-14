import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { jsPDF } from 'jspdf';
import { Download, Award, Flame, Users, Clock, ShieldAlert, Cpu, Heart, CheckCircle2 } from 'lucide-react';

// Reusable cursor-tracking 3D Hover Tilt Card wrapper
const TiltCard = ({ children, className = '' }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - card.left) / card.width; // 0 to 1
    const y = (e.clientY - card.top) / card.height; // 0 to 1
    
    // Scale rotation to max 8 degrees to keep readable while maintaining depth
    const rotateX = (0.5 - y) * 8;
    const rotateY = (x - 0.5) * 8;
    setTilt({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0 });
  };

  const transformStr = isHovered
    ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-4px)`
    : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)';

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: transformStr,
        transition: isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)',
        transformStyle: 'preserve-3d'
      }}
      className={`glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-2xl dark:shadow-emerald-500/10 bg-slate-50/90 dark:bg-slate-900/75' : 'bg-white/70 dark:bg-slate-900/60'
      } ${className}`}
    >
      {/* Decorative top-edge reflective border */}
      {isHovered && (
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent pointer-events-none"></div>
      )}
      {children}
    </div>
  );
};

// Premium Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (active && payload && payload.length) {
    return (
      <div className="backdrop-blur-md bg-slate-900/90 dark:bg-slate-950/90 border border-slate-200/10 dark:border-slate-800/80 rounded-2xl p-4 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
        <p className="text-sm font-black text-white">
          {prefix}{payload[0].value}{suffix}
        </p>
      </div>
    );
  }
  return null;
};

// Holographic 3D Isometric Zone Occupancy Towers Component
const ZoneTowers3D = ({ data }) => {
  if (!data || data.length === 0) return null;

  const zoneColors = {
    'Quiet Study': { top: '#34d399', sideLeft: '#10b981', sideRight: '#047857', glow: 'rgba(16, 185, 129, 0.4)' },
    'Coding Lab': { top: '#60a5fa', sideLeft: '#3b82f6', sideRight: '#1d4ed8', glow: 'rgba(59, 130, 246, 0.4)' },
    'Collaborative Space': { top: '#a78bfa', sideLeft: '#8b5cf6', sideRight: '#6d28d9', glow: 'rgba(139, 92, 246, 0.4)' }
  };

  const defaultColors = { top: '#f472b6', sideLeft: '#ec4899', sideRight: '#be185d', glow: 'rgba(236, 72, 153, 0.4)' };

  // Arrange the 3 zones in isometric coordinate space
  // We place Tower 2 (Coding Lab) at the back, Tower 1 (Quiet Study) and Tower 3 (Collaborative Space) in the front.
  // By rendering Tower 2 first in the DOM, it properly respects z-sorting.
  const towerPositions = [
    { cx: 300, cy: 130, label: 'Coding Lab' },
    { cx: 180, cy: 180, label: 'Quiet Study' },
    { cx: 420, cy: 180, label: 'Collaborative Space' }
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center relative bg-slate-950/30 rounded-3xl p-6 border border-slate-200/5 dark:border-slate-800/40 shadow-inner">
      <style>{`
        @keyframes float-p1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        @keyframes float-p2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes float-p3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        .tower-float-0 { animation: float-p1 5s infinite ease-in-out; }
        .tower-float-1 { animation: float-p2 6s infinite ease-in-out; }
        .tower-float-2 { animation: float-p3 4.5s infinite ease-in-out; }
      `}</style>
      
      <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-400 mb-4 self-start flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        Holographic 3D Zone Occupancy Towers
      </h4>
      
      <svg viewBox="0 0 600 320" className="w-full h-auto max-w-[500px]">
        {/* Definition for Grid Background & Glow Filters */}
        <defs>
          <pattern id="isometric-grid" width="40" height="20" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 10 L 40 20 M 0 10 L 40 10" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
          </pattern>
          <filter id="hologram-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Isometric Grid Floor */}
        <ellipse cx="300" cy="205" rx="250" ry="90" fill="rgba(15, 23, 42, 0.45)" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1.5" />
        <ellipse cx="300" cy="205" rx="240" ry="80" fill="url(#isometric-grid)" />

        {/* Draw Laser Ring Guides */}
        <ellipse cx="300" cy="205" rx="180" ry="60" fill="none" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1.5" strokeDasharray="5 5" />
        <ellipse cx="300" cy="205" rx="110" ry="38" fill="none" stroke="rgba(59, 130, 246, 0.06)" strokeWidth="1" />

        {/* Base Grid Crosshairs */}
        <line x1="300" y1="115" x2="300" y2="295" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
        <line x1="60" y1="205" x2="540" y2="205" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />

        {/* Draw the 3D Towers */}
        {towerPositions.map((pos, idx) => {
          const zoneInfo = data.find(z => z.zone.toLowerCase().includes(pos.label.toLowerCase())) || { percentage: 0 };
          const percent = zoneInfo.percentage || 0;
          
          // Compute tower height based on percentage (scale 0% to 100% -> 30px to 140px)
          const baseHeight = 25; 
          const h = baseHeight + (percent / 100) * 115;
          const w = 34; // half width

          const colors = zoneColors[pos.label] || defaultColors;
          const cx = pos.cx;
          const cy = pos.cy;

          return (
            <g key={pos.label} className={`tower-float-${idx} transition-all duration-500 hover:-translate-y-1 cursor-pointer`}>
              {/* 1. Floor Reflection Base */}
              <ellipse cx={cx} cy={cy + 15} rx={w * 1.4} ry={w * 0.7} fill={colors.glow} opacity="0.3" filter="url(#hologram-glow)" />
              
              {/* 2. Grid Anchor point */}
              <ellipse cx={cx} cy={cy + 15} rx={w} ry={w * 0.5} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
              <ellipse cx={cx} cy={cy + 15} rx={w * 0.65} ry={w * 0.325} fill="none" stroke={colors.sideLeft} strokeWidth="1.5" opacity="0.5" />

              {/* 3. Left Side Face */}
              <polygon
                points={`
                  ${cx - w},${cy + 15} 
                  ${cx},${cy + 15 + w * 0.5} 
                  ${cx},${cy + 15 + w * 0.5 - h} 
                  ${cx - w},${cy + 15 - h}
                `}
                fill={`url(#leftGrad-${idx})`}
              />
              <defs>
                <linearGradient id={`leftGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.sideLeft} stopOpacity="0.8" />
                  <stop offset="100%" stopColor={colors.sideLeft} stopOpacity="0.15" />
                </linearGradient>
              </defs>

              {/* 4. Right Side Face */}
              <polygon
                points={`
                  ${cx},${cy + 15 + w * 0.5} 
                  ${cx + w},${cy + 15} 
                  ${cx + w},${cy + 15 - h} 
                  ${cx},${cy + 15 + w * 0.5 - h}
                `}
                fill={`url(#rightGrad-${idx})`}
              />
              <defs>
                <linearGradient id={`rightGrad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={colors.sideRight} stopOpacity="0.85" />
                  <stop offset="100%" stopColor={colors.sideRight} stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* 5. Top Glowing Lid Face */}
              <polygon
                points={`
                  ${cx - w},${cy + 15 - h} 
                  ${cx},${cy + 15 + w * 0.5 - h} 
                  ${cx + w},${cy + 15 - h} 
                  ${cx},${cy + 15 - w * 0.5 - h}
                `}
                fill={`url(#topGrad-${idx})`}
                stroke={colors.top}
                strokeWidth="1.5"
                style={{ filter: `drop-shadow(0 0 6px ${colors.top})` }}
              />
              <defs>
                <linearGradient id={`topGrad-${idx}`} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={colors.top} />
                  <stop offset="100%" stopColor={colors.sideLeft} />
                </linearGradient>
              </defs>

              {/* 6. Percentage Float Label above the tower */}
              <g transform={`translate(${cx}, ${cy - h - 8})`}>
                <rect x="-22" y="-12" width="44" height="17" rx="5" fill="rgba(15,23,42,0.85)" stroke={colors.top} strokeWidth="1" />
                <text x="0" y="1" textAnchor="middle" fill="#fff" className="text-[9px] font-black tracking-wider pointer-events-none">
                  {percent}%
                </text>
              </g>

              {/* 7. Zone Label below the tower base */}
              <text x={cx} y={cy + 42} textAnchor="middle" fill="rgba(255,255,255,0.7)" className="text-[10px] font-bold tracking-wide pointer-events-none">
                {pos.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get('/analytics');
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    if (!analyticsData) return;

    const doc = new jsPDF();
    const now = new Date();

    doc.setFillColor(9, 13, 22);
    doc.rect(0, 0, 210, 45, 'F');

    doc.setTextColor(16, 185, 129);
    doc.setFontSize(22);
    doc.setFont('Helvetica', 'bold');
    doc.text('DESKGUARD AUDIT REPORT', 15, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('Helvetica', 'normal');
    doc.text('Smart Library Seat Booking & Anti-Hoarding System', 15, 28);
    doc.text(`Generated: ${now.toLocaleString()}`, 145, 20);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);

    doc.rect(15, 55, 55, 30, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.text('TOTAL SESSIONS LOGGED', 18, 62);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text(String(analyticsData.totalBookings || 0), 18, 75);

    doc.rect(78, 55, 55, 30, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('AVG USE DURATION', 81, 62);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${analyticsData.avgDurationMins} min`, 81, 75);

    const topZone = analyticsData.zoneAnalytics?.sort((a,b) => b.percentage - a.percentage)[0]?.zone || 'Quiet Zone';
    doc.rect(140, 55, 55, 30, 'FD');
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('MOST POPULAR ZONE', 143, 62);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text(topZone, 143, 75);

    doc.setFontSize(14);
    doc.setTextColor(9, 13, 22);
    doc.text('Busiest Operating Hours', 15, 100);
    doc.line(15, 103, 195, 103);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Hour Block', 20, 113);
    doc.text('Session Count', 80, 113);
    doc.text('Relative Capacity Load', 140, 113);
    
    doc.line(15, 117, 195, 117);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    let yOffset = 125;
    const sortedHours = [...analyticsData.peakHours]
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);

    sortedHours.forEach(hourItem => {
      doc.text(hourItem.hour, 20, yOffset);
      doc.text(`${hourItem.count} check-ins`, 80, yOffset);
      
      const load = hourItem.count > 5 ? 'HIGH LOAD' : 'MODERATE';
      doc.text(load, 140, yOffset);
      yOffset += 10;
    });

    doc.setFontSize(14);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(9, 13, 22);
    doc.text('Top Reserved Desk Nodes', 15, 185);
    doc.line(15, 188, 195, 188);

    doc.setFontSize(10);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('Desk ID', 20, 198);
    doc.text('Desk Location Name', 80, 198);
    doc.text('Reservations', 150, 198);

    doc.line(15, 202, 195, 202);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    yOffset = 210;
    analyticsData.mostUsedDesks.forEach(desk => {
      doc.text(desk.id, 20, yOffset);
      doc.text(desk.name, 80, yOffset);
      doc.text(`${desk.count} bookings`, 150, yOffset);
      yOffset += 10;
    });

    doc.line(15, 275, 195, 275);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('DeskGuard System Audit Report - Security and Fairness Protocol.', 15, 281);
    doc.text('Page 1 of 1', 180, 281);

    doc.save(`deskguard_audit_report_${now.toISOString().split('T')[0]}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center text-slate-400 font-semibold">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
          <span>Fetching library booking logs and calculations...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) return null;

  const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899'];
  const topDesk = analyticsData.mostUsedDesks[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
            Library Usage Analytics
          </h1>
          <p className="text-sm text-slate-400 font-semibold mt-1">
            Aggregate study logs, Peak occupancy index, and exportable PDF audit files.
          </p>
        </div>
        
        <button
          onClick={handleExportPDF}
          className="flex items-center space-x-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-neon-green hover:shadow-emerald-500/40 hover:-translate-y-0.5 transform transition-all duration-300"
        >
          <Download className="h-4 w-4" />
          <span>Export Audit PDF</span>
        </button>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-md flex items-center space-x-4 bg-white/70 dark:bg-slate-900/60 hover:shadow-lg transition-all duration-300">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shadow-[0_0_12px_rgba(16,185,129,0.2)] border border-emerald-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Bookings</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">{analyticsData.totalBookings}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-md flex items-center space-x-4 bg-white/70 dark:bg-slate-900/60 hover:shadow-lg transition-all duration-300">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shadow-[0_0_12px_rgba(99,102,241,0.2)] border border-indigo-500/20">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Avg Stay Time</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">{analyticsData.avgDurationMins} mins</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-md flex items-center space-x-4 bg-white/70 dark:bg-slate-900/60 hover:shadow-lg transition-all duration-300">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.2)] border border-amber-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Popular Node</span>
            <span className="text-xl font-extrabold text-slate-800 dark:text-white">{topDesk ? topDesk.id : 'N/A'}</span>
          </div>
        </div>

        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-md flex items-center space-x-4 bg-white/70 dark:bg-slate-900/60 hover:shadow-lg transition-all duration-300">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center shadow-[0_0_12px_rgba(139,92,246,0.2)] border border-purple-500/20">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Top Zone</span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white truncate max-w-[120px] block">
              {analyticsData.zoneAnalytics[0]?.zone || 'Quiet Study'}
            </span>
          </div>
        </div>

      </div>

      {/* Row 1: Occupancy Curve (Area) & Hourly Peak Load (Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* CHART 1: Daily Occupancy Rate */}
        <TiltCard>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Cpu className="h-4 w-4 text-emerald-500" />
            Daily Seat Occupancy rate
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analyticsData.dailyOccupancy} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="occupancyGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <filter id="neonGlowLine" x="-10%" y="-10%" width="120%" height="120%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip content={<CustomTooltip suffix="%" />} />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="#10b981" 
                  fill="url(#occupancyGlow)" 
                  strokeWidth={3} 
                  filter="url(#neonGlowLine)"
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }} 
                  activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 1.5 }} 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        {/* CHART 2: Peak Library Hours */}
        <TiltCard>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Clock className="h-4 w-4 text-cyan-500" />
            Peak Library load (Operating hours)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.peakHours} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cyanBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip suffix=" check-ins" />} />
                <Bar 
                  dataKey="count" 
                  fill="url(#cyanBlueGrad)" 
                  radius={[5, 5, 0, 0]} 
                  barSize={14} 
                  style={{ filter: 'drop-shadow(0 4px 6px rgba(6,182,212,0.15))' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

      </div>

      {/* Row 2: Study Zone Allocation (Pie) & 3D Isometric Holographic Towers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* CHART 3: Study Zone Allocation Ratio */}
        <TiltCard>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Award className="h-4 w-4 text-indigo-500" />
            Study zone allocation ratio
          </h3>
          <div className="h-64 w-full flex items-center justify-center relative">
            
            {/* Center Label inside Doughnut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-10px]">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Sessions</span>
              <span className="text-3xl font-black text-slate-800 dark:text-white leading-none mt-1">
                {analyticsData.totalBookings}
              </span>
            </div>

            <div className="w-1/2 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <radialGradient id="emeraldPieGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#047857" />
                    </radialGradient>
                    <radialGradient id="bluePieGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </radialGradient>
                    <radialGradient id="purplePieGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </radialGradient>
                    <radialGradient id="yellowPieGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#fbbf24" />
                      <stop offset="100%" stopColor="#b45309" />
                    </radialGradient>
                    <radialGradient id="pinkPieGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#f472b6" />
                      <stop offset="100%" stopColor="#be185d" />
                    </radialGradient>
                  </defs>
                  <Pie
                    data={analyticsData.zoneAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="percentage"
                    nameKey="zone"
                    stroke="rgba(15, 23, 42, 0.45)"
                    strokeWidth={2}
                  >
                    {analyticsData.zoneAnalytics.map((entry, index) => {
                      const gradIds = ['url(#emeraldPieGrad)', 'url(#bluePieGrad)', 'url(#purplePieGrad)', 'url(#yellowPieGrad)', 'url(#pinkPieGrad)'];
                      return (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={gradIds[index % gradIds.length]} 
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<CustomTooltip suffix="%" />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Custom Premium Legend List */}
            <div className="w-1/2 flex flex-col space-y-3.5 text-xs font-semibold text-slate-600 dark:text-slate-300 pl-4 z-10">
              {analyticsData.zoneAnalytics.map((entry, idx) => (
                <div key={idx} className="flex items-center space-x-3 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-2 rounded-xl transition-all hover:translate-x-1">
                  <span 
                    className="h-3 w-3 rounded-full shadow-sm" 
                    style={{ 
                      background: `linear-gradient(135deg, ${COLORS[idx % COLORS.length]} 0%, #090d16 100%)` 
                    }}
                  ></span>
                  <span className="truncate flex-1">
                    {entry.zone}
                  </span>
                  <span className="font-extrabold text-slate-800 dark:text-white px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                    {entry.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </TiltCard>

        {/* CHART 4: Holographic 3D Zone Occupancy Towers */}
        <TiltCard>
          <ZoneTowers3D data={analyticsData.zoneAnalytics} />
        </TiltCard>

      </div>

      {/* Row 3: Busiest Seat nodes (Progress) & Anti-Hoarding Compliance (Security) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* CHART 5: Busiest Seat nodes */}
        <TiltCard>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Flame className="h-4 w-4 text-emerald-500" />
            Busiest Seat nodes (Count of bookings)
          </h3>
          <div className="space-y-4">
            {analyticsData.mostUsedDesks.map((desk, idx) => {
              const maxVal = analyticsData.totalBookings || 10;
              const percent = Math.min(100, Math.round((desk.count / maxVal) * 150));
              return (
                <div key={desk.id} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                    <span>{desk.name} ({desk.id})</span>
                    <span className="text-emerald-500 font-semibold">{desk.count} bookings</span>
                  </div>

                  {/* 3D Glossy Glass Cylindrical tube track */}
                  <div className="w-full h-4 bg-slate-900/40 dark:bg-slate-950/60 rounded-full border border-slate-200/5 dark:border-slate-800/50 overflow-hidden relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                    
                    {/* Inner glowing fluid container */}
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 rounded-full relative shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                      style={{ 
                        width: `${percent}%`,
                        transition: 'width 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)' 
                      }}
                    >
                      {/* Gloss Highlight line to simulate cylindrical glass lens shine */}
                      <div className="absolute top-[1px] left-[2px] right-[2px] h-[2px] bg-white/40 rounded-full blur-[0.2px]"></div>
                      <div className="absolute bottom-[1px] left-[2px] right-[2px] h-[1px] bg-black/20 rounded-full"></div>
                    </div>

                    {/* Overall glass panel shadow lines */}
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none rounded-full"></div>
                  </div>
                </div>
              );
            })}
          </div>
        </TiltCard>

        {/* CHART 6: Security Compliance & Anti-Hoarding Index */}
        <TiltCard>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-6 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-emerald-500" />
            Security & Anti-Hoarding Index
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            
            {/* Holographic 3D Shield Vector and Circular Meter */}
            <div className="flex flex-col items-center justify-center space-y-4">
              
              <div className="relative h-28 w-28 flex items-center justify-center bg-slate-950/20 rounded-3xl p-2 border border-slate-200/5 dark:border-slate-800/30">
                <svg className="h-full w-full transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    fill="none"
                    stroke="rgba(255,255,255,0.02)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    fill="none"
                    stroke="url(#securityMeterGrad)"
                    strokeWidth="8"
                    strokeDasharray={276}
                    strokeDashoffset={276 * (1 - 0.96)}
                    strokeLinecap="round"
                    style={{
                      filter: 'drop-shadow(0 0 6px #10b981)'
                    }}
                  />
                  <defs>
                    <linearGradient id="securityMeterGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#34d399" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center mt-[-2px]">
                  <span className="text-xl font-black text-slate-800 dark:text-white">96%</span>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-0.5">Fairness</span>
                </div>
              </div>
              
              {/* 3D Security Shield Vector Badge */}
              <div className="flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl">
                <svg viewBox="0 0 100 100" className="h-6 w-6 drop-shadow-[0_0_4px_rgba(16,185,129,0.4)]">
                  <path d="M 50 10 L 22 24 L 22 56 L 50 82 Z" fill="url(#shield-left)" />
                  <path d="M 50 10 L 78 24 L 78 56 L 50 82 Z" fill="url(#shield-right)" />
                  <line x1="50" y1="10" x2="50" y2="82" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
                  <path d="M 37 43 L 47 53 L 64 34" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="shield-left" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#34d399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="shield-right" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#059669" />
                      <stop offset="100%" stopColor="#047857" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Protocol Active</span>
              </div>
              
            </div>

            {/* Security stats list */}
            <div className="flex-1 w-full space-y-2.5">
              
              <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Seat Turnover Rate</span>
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-white">2.4 / day</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Auto-Releases Enforced</span>
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-white">12 bookings</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Avg Presence Confirm Time</span>
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-white">1.8 min</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-2.5 rounded-xl">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Active Hoarding Alerts</span>
                </div>
                <span className="text-xs font-black text-slate-800 dark:text-white">0 active</span>
              </div>

            </div>

          </div>
        </TiltCard>

      </div>

    </div>
  );
};
