/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#080810',
          surface: '#0f0f1a',
          elevated: '#161625',
        },
        accent: {
          primary: '#6366f1',
          secondary: '#8b5cf6',
          glow: 'rgba(99,102,241,0.15)',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
        },
        border: {
          subtle: 'rgba(255,255,255,0.06)',
          accent: 'rgba(99,102,241,0.3)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'gradient-rotate': 'gradientRotate 4s linear infinite',
        'mesh-drift': 'meshDrift 8s ease-in-out infinite alternate',
        'pulse-dot': 'pulseDot 2s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer: 'shimmer 1.5s infinite',
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'scan-pulse': 'scanPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        gradientRotate: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        meshDrift: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '100% 100%' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scanPulse: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
      },
    },
  },
  plugins: [],
}
