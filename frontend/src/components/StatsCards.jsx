import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, UserX, Clock } from 'lucide-react';

export const StatsCards = ({ desks = [], abandonedCount = 0 }) => {
  const available = desks.filter(d => d.status === 'available').length;
  const occupied = desks.filter(d => d.status === 'occupied').length;
  const away = desks.filter(d => d.status === 'away').length;

  const cardData = [
    {
      title: 'Available Seats',
      value: available,
      icon: CheckCircle,
      color: 'text-emerald-500 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'group-hover:border-emerald-500/35',
      glowColor: 'shadow-emerald-500/10 group-hover:shadow-emerald-500/25',
    },
    {
      title: 'Occupied Seats',
      value: occupied,
      icon: Clock,
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'group-hover:border-red-500/35',
      glowColor: 'shadow-red-500/10 group-hover:shadow-red-500/25',
    },
    {
      title: 'Away Seats',
      value: away,
      icon: AlertTriangle,
      color: 'text-amber-500 dark:text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'group-hover:border-amber-500/35',
      glowColor: 'shadow-amber-500/10 group-hover:shadow-amber-500/25',
    },
    {
      title: 'Abandoned Seats',
      value: abandonedCount,
      icon: UserX,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'group-hover:border-rose-500/35',
      glowColor: 'shadow-rose-500/10 group-hover:shadow-rose-500/25',
    }
  ];

  // Container motion options
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 w-full"
    >
      {cardData.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={idx}
            variants={cardVariants}
            className={`group relative card-3d glass-panel rounded-2xl p-5 md:p-6 transition-all duration-300 border border-slate-200/50 dark:border-slate-800/50 shadow-md ${card.glowColor}`}
          >
            {/* Glossy highlight line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] md:text-xs font-semibold text-slate-400 uppercase tracking-widest">
                {card.title}
              </span>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bgColor} ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
            
            <div className="flex items-baseline">
              <span className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-white">
                {card.value}
              </span>
              <span className="text-xs text-slate-400 ml-2 font-medium">seats</span>
            </div>

            {/* Glowing spot effect */}
            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-emerald-500 opacity-0 group-hover:opacity-5 blur-xl transition-opacity duration-300"></div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};
