/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#07070a',
        surface: {
          DEFAULT: 'rgba(10, 10, 15, 0.65)',
          hover: 'rgba(18, 18, 28, 0.75)',
          active: 'rgba(25, 25, 38, 0.85)',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        aethel: {
          cyan: '#06b6d4',
          emerald: '#10b981',
          purple: '#8b5cf6',
          danger: '#ef4444',
          warning: '#f59e0b',
        }
      },
      backdropBlur: {
        'liquid': '20px',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'subtle-float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.8))' },
          '50%': { opacity: '0.4', filter: 'drop-shadow(0 0 2px rgba(16, 185, 129, 0.2))' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
};

