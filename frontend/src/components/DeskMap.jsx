import React, { useState } from 'react';
import { Layers, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

export const DeskMap = ({ desks = [], onDeskClick }) => {
  const [is3D, setIs3D] = useState(true);

  // Map desk IDs to coordinates on the floor plan
  const deskCoordinates = {
    D01: { x: 110, y: 120, label: 'D1', zone: 'Quiet Study' },
    D02: { x: 190, y: 120, label: 'D2', zone: 'Quiet Study' },
    D03: { x: 110, y: 190, label: 'D3', zone: 'Quiet Study' },
    D04: { x: 190, y: 190, label: 'D4', zone: 'Quiet Study' },
    
    D05: { x: 530, y: 120, label: 'D5', zone: 'Coding Lab', monitor: true },
    D06: { x: 610, y: 120, label: 'D6', zone: 'Coding Lab', monitor: true },
    D07: { x: 530, y: 190, label: 'D7', zone: 'Coding Lab', monitor: true },
    D08: { x: 610, y: 190, label: 'D8', zone: 'Coding Lab', monitor: true },
    
    D09: { x: 150, y: 380, label: 'D9', zone: 'Collaborative Space', size: 'large' },
    D10: { x: 270, y: 380, label: 'D10', zone: 'Collaborative Space', size: 'large' },
    D11: { x: 390, y: 380, label: 'D11', zone: 'Collaborative Space', size: 'large' },
    D12: { x: 510, y: 380, label: 'D12', zone: 'Collaborative Space', size: 'large' },
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'occupied':
        return {
          stroke: '#ef4444',
          fill: 'rgba(239, 68, 68, 0.25)',
          glow: '#ef4444',
          glowOpacity: 0.25,
          text: 'text-red-500'
        };
      case 'away':
        return {
          stroke: '#f59e0b',
          fill: 'rgba(245, 158, 11, 0.25)',
          glow: '#f59e0b',
          glowOpacity: 0.25,
          text: 'text-amber-500'
        };
      case 'available':
      default:
        return {
          stroke: '#10b981',
          fill: 'rgba(16, 185, 129, 0.25)',
          glow: '#10b981',
          glowOpacity: 0.25,
          text: 'text-emerald-500'
        };
    }
  };

  return (
    <div className="w-full glass-panel rounded-3xl p-6 border border-slate-200/50 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
      
      {/* CSS Animations for bouncing 3D orbs and laser lines */}
      <style>{`
        @keyframes hover-bounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .bounce-orb {
          animation: hover-bounce 3s infinite ease-in-out;
        }
        .blueprint-grid-3d {
          perspective: 1200px;
        }
        .floor-svg-canvas {
          transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-style: preserve-3d;
        }
        .floor-svg-3d {
          transform: rotateX(25deg) rotateY(0deg) rotateZ(-12deg);
        }
      `}</style>

      {/* Map Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-3 z-10 relative">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Interactive Seat Grid Map
          </h2>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">Click any seat block to reserve or view timers</p>
        </div>

        {/* 3D view toggle and status keys */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
          
          {/* 3D Toggle Button */}
          <button
            onClick={() => setIs3D(!is3D)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 bg-white/40 dark:bg-slate-900/40 hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400 hover:border-emerald-500/30 transition-all shadow-sm"
          >
            <Layers className="h-4 w-4" />
            <span>{is3D ? 'Flat 2D View' : 'Perspective 3D View'}</span>
          </button>

          {/* Color Indicators */}
          <div className="flex items-center space-x-4 text-slate-600 dark:text-slate-300">
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 shadow-neon-green"></span>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-red-500 shadow-neon-red"></span>
              <span>Occupied</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500 shadow-neon-yellow animate-pulse"></span>
              <span>Away</span>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="w-full overflow-hidden relative blueprint-grid-3d rounded-2xl py-4 bg-slate-900/10 dark:bg-slate-950/20">
        <svg 
          viewBox="0 0 800 500" 
          className={`w-full min-w-[700px] h-auto border border-slate-200/10 dark:border-slate-800/10 rounded-2xl floor-svg-canvas ${is3D ? 'floor-svg-3d' : ''}`}
        >
          {/* Blueprint Grid Lines Pattern */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="1" />
            </pattern>
            
            {/* Status Neon Gradients */}
            <radialGradient id="green-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="red-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="yellow-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* ZONE 1: QUIET STUDY */}
          <g>
            <rect x="40" y="30" width="320" height="230" rx="15" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="2" strokeDasharray="6 4" />
            <text x="60" y="55" className="text-xs font-black tracking-widest fill-slate-400 dark:fill-slate-500 uppercase select-none pointer-events-none">
              Quiet Study Area
            </text>
            <line x1="60" y1="65" x2="150" y2="65" stroke="rgba(16, 185, 129, 0.15)" strokeWidth="2" />
          </g>

          {/* ZONE 2: TECH LAB */}
          <g>
            <rect x="440" y="30" width="320" height="230" rx="15" fill="none" stroke="rgba(59, 130, 246, 0.05)" strokeWidth="2" strokeDasharray="6 4" />
            <text x="460" y="55" className="text-xs font-black tracking-widest fill-slate-400 dark:fill-slate-500 uppercase select-none pointer-events-none">
              Tech Coding Lab
            </text>
            <line x1="460" y1="65" x2="550" y2="65" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="2" />
            
            {/* Server cabinet decorations */}
            <rect x="700" y="55" width="45" height="15" rx="3" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle cx="708" cy="62" r="1.5" fill="#10b981" />
            <circle cx="715" cy="62" r="1.5" fill="#ef4444" className="animate-pulse" />
            <circle cx="722" cy="62" r="1.5" fill="#10b981" />
            <circle cx="729" cy="62" r="1.5" fill="#10b981" />
          </g>

          {/* ZONE 3: COLLABORATIVE SPACE */}
          <g>
            <rect x="40" y="290" width="720" height="180" rx="15" fill="none" stroke="rgba(139, 92, 246, 0.05)" strokeWidth="2" strokeDasharray="6 4" />
            <text x="60" y="315" className="text-xs font-black tracking-widest fill-slate-400 dark:fill-slate-500 uppercase select-none pointer-events-none">
              Collaborative space
            </text>
            <line x1="60" y1="325" x2="160" y2="325" stroke="rgba(139, 92, 246, 0.15)" strokeWidth="2" />
            
            {/* Lounge tables vector decoration */}
            <circle cx="680" cy="380" r="24" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="2" />
            <circle cx="680" cy="380" r="10" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
          </g>

          {/* SEAT TILES (2D vs 3D) */}
          {desks.map(desk => {
            const coord = deskCoordinates[desk.id];
            if (!coord) return null;

            const style = getStatusColor(desk.status);
            const isLarge = coord.size === 'large';
            const w = isLarge ? 70 : 46;
            const h = isLarge ? 46 : 30;

            if (is3D) {
              // 3D Isometric Projection Drawings
              const glowGrad = desk.status === 'occupied' ? 'url(#red-glow)' : desk.status === 'away' ? 'url(#yellow-glow)' : 'url(#green-glow)';
              return (
                <g 
                  key={desk.id} 
                  transform={`translate(${coord.x}, ${coord.y})`}
                  onClick={() => onDeskClick(desk)}
                  className="cursor-pointer group select-none"
                >
                  {/* A. Floor Underglow */}
                  <ellipse cx="0" cy="18" rx={w * 0.75} ry={h * 0.75} fill={glowGrad} />

                  {/* B. Desk Support Posts (Legs) */}
                  <line x1={-w/2 + 4} y1="0" x2={-w/2 + 4} y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
                  <line x1={w/2 - 4} y1="0" x2={w/2 - 4} y2="16" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" />
                  <line x1={-w/4} y1="-5" x2={-w/4} y2="12" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                  <line x1={w/4} y1="-5" x2={w/4} y2="12" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />

                  {/* C. 3D Thick Table Side Panel */}
                  <polygon 
                    points={`-${w/2},-6 ${w/2},-6 ${w/2},0 -${w/2},0`} 
                    fill="rgba(15, 23, 42, 0.85)" 
                    stroke={style.stroke} 
                    strokeWidth="1" 
                  />

                  {/* D. 3D Isometric Desktop Surface (Tilted glass panel) */}
                  <polygon 
                    points={`-${w/2},-6 ${w/2},-6 ${w/2 - 8},-${h} -${w/2 - 8},-${h}`} 
                    fill="rgba(30, 41, 59, 0.7)" 
                    stroke={style.stroke} 
                    strokeWidth="1.5"
                    className="transition-all duration-300 group-hover:fill-slate-700/60"
                  />

                  {/* E. 3D Stand and Computer Screen Monitor (if Tech Room) */}
                  {coord.monitor && (
                    <g transform="translate(0, -15)">
                      {/* Stand Stem */}
                      <line x1="0" y1="0" x2="0" y2="-8" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" />
                      <ellipse cx="0" cy="0" rx="6" ry="2" fill="rgba(255,255,255,0.2)" />
                      {/* 3D Monitor Glass */}
                      <polygon 
                        points="-15,-20 15,-20 12,-8 -12,-8" 
                        fill={desk.status === 'occupied' ? 'rgba(16, 185, 129, 0.65)' : 'rgba(15, 23, 42, 0.9)'}
                        stroke={desk.status === 'occupied' ? '#10b981' : 'rgba(255,255,255,0.2)'}
                        strokeWidth="1"
                        style={{
                          filter: desk.status === 'occupied' ? 'drop-shadow(0 0 4px #10b981)' : 'none'
                        }}
                      />
                      {/* Keyboard panel */}
                      <polygon points="-8,-2 8,-2 10,0 -10,0" fill="rgba(255,255,255,0.1)" />
                    </g>
                  )}

                  {/* F. 3D Chair representation */}
                  <g transform={`translate(${isLarge ? -15 : 0}, 25)`}>
                    {/* Backrest */}
                    <path d="M -8,-25 L 8,-25 L 6,-15 L -6,-15 Z" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                    {/* Seat cushion */}
                    <ellipse cx="0" cy="-14" rx="10" ry="5" fill="rgba(30, 41, 59, 0.85)" stroke="rgba(255,255,255,0.15)" />
                    {/* Support Stem */}
                    <line x1="0" y1="-14" x2="0" y2="-4" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
                    {/* Base legs */}
                    <line x1="0" y1="-4" x2="-6" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                    <line x1="0" y1="-4" x2="6" y2="1" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                  </g>

                  {/* G. Floating 3D status orb (Bounces and glows) */}
                  <g className="bounce-orb" transform={`translate(0, -${h + 16})`}>
                    {/* Glow ring */}
                    <circle cx="0" cy="0" r="9" fill="none" stroke={style.stroke} strokeWidth="1" opacity="0.3" className="animate-ping" />
                    {/* Inner core orb */}
                    <circle 
                      cx="0" 
                      cy="0" 
                      r="4.5" 
                      fill={style.stroke} 
                      style={{
                        filter: `drop-shadow(0 0 6px ${style.stroke})`
                      }}
                    />
                  </g>

                  {/* H. Floating Text Desk Label */}
                  <text 
                    x="0" 
                    y={-h/2}
                    textAnchor="middle" 
                    className="text-[9px] font-black fill-slate-200 pointer-events-none select-none drop-shadow-md"
                  >
                    {coord.label}
                  </text>
                </g>
              );
            } else {
              // Standard Flat 2D View
              return (
                <g 
                  key={desk.id} 
                  transform={`translate(${coord.x}, ${coord.y})`}
                  onClick={() => onDeskClick(desk)}
                  className="cursor-pointer group select-none"
                >
                  <rect 
                    x={-w/2} 
                    y={-h/2} 
                    width={w} 
                    height={h} 
                    rx="6" 
                    fill={style.fill}
                    stroke={style.stroke}
                    strokeWidth="1.5"
                    style={{
                      filter: `drop-shadow(0 0 6px ${style.stroke}25)`
                    }}
                    className="transition-transform duration-300 group-hover:scale-105"
                  />
                  <circle 
                    cx={isLarge ? 20 : 12}
                    cy={isLarge ? 12 : 8}
                    r="4" 
                    fill={style.stroke}
                    className={desk.status === 'away' ? 'animate-pulse' : ''}
                    style={{
                      filter: `drop-shadow(0 0 4px ${style.stroke})`
                    }}
                  />
                  <text 
                    x="0" 
                    y="4" 
                    textAnchor="middle" 
                    className="text-[10px] md:text-xs font-bold fill-slate-700 dark:fill-slate-200 pointer-events-none"
                  >
                    {coord.label}
                  </text>
                </g>
              );
            }
          })}

          {/* Lobby Door Decoration */}
          <g transform="translate(400, 480)" className="select-none pointer-events-none">
            <line x1="-30" y1="0" x2="30" y2="0" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <text x="0" y="-12" textAnchor="middle" className="text-[9px] font-bold fill-slate-500 uppercase tracking-widest">Main Lobby Entrance</text>
          </g>
        </svg>
      </div>
    </div>
  );
};
