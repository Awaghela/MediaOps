/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: {
          900: '#080C18',
          800: '#0D1225',
          700: '#141830',
          600: '#1C2240',
          500: '#242B4E',
        },
        surface: {
          DEFAULT: '#141830',
          hover: '#1C2240',
          elevated: '#1E2548',
        },
        violet: {
          400: '#9B8FFF',
          500: '#7B6FEF',
          600: '#6C5FDE',
        },
        cyan: {
          400: '#22EDD8',
          500: '#00D2C0',
        },
        rose: {
          400: '#FF7090',
          500: '#FF4D6D',
        },
        amber: {
          400: '#FFD166',
          500: '#FFBD00',
        },
        slate: {
          400: '#8892B0',
          300: '#A8B2D8',
          200: '#CCD6F6',
        },
        border: {
          DEFAULT: '#1E2548',
          light: '#2D3564',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(135deg, #141830 0%, #1C2240 100%)',
        'gradient-violet': 'linear-gradient(135deg, #6C5FDE 0%, #9B8FFF 100%)',
        'gradient-cyan': 'linear-gradient(135deg, #00D2C0 0%, #22EDD8 100%)',
        'gradient-rose': 'linear-gradient(135deg, #FF4D6D 0%, #FF7090 100%)',
        'gradient-amber': 'linear-gradient(135deg, #FFBD00 0%, #FFD166 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'count-up': 'countUp 1s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(16px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
      },
      boxShadow: {
        'glow-violet': '0 0 20px rgba(108, 95, 222, 0.25)',
        'glow-cyan': '0 0 20px rgba(0, 210, 192, 0.25)',
        'glow-rose': '0 0 20px rgba(255, 77, 109, 0.25)',
        card: '0 4px 24px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};
