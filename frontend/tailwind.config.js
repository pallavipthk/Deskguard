/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#090d16',
        darkCard: 'rgba(16, 22, 38, 0.65)',
        lightBg: '#f1f5f9',
        lightCard: 'rgba(255, 255, 255, 0.7)',
        neonGreen: '#10b981',
        neonYellow: '#f59e0b',
        neonRed: '#ef4444',
      },
      boxShadow: {
        'neon-green': '0 0 15px rgba(16, 185, 129, 0.4)',
        'neon-yellow': '0 0 15px rgba(245, 158, 11, 0.4)',
        'neon-red': '0 0 15px rgba(239, 68, 68, 0.4)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
      }
    },
  },
  plugins: [],
}
