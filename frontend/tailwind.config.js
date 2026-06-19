/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base:    '#f8fafc',
          surface: '#f1f5f9',
          elevated: '#e2e8f0',
        },
        accent: {
          primary:   '#4f46e5',
          secondary: '#7c3aed',
          glow:      'rgba(79,70,229,0.09)',
          cyan:      '#0891b2',
        },
        success: '#16a34a',
        warning: '#d97706',
        danger:  '#dc2626',
        text: {
          primary:   '#0f172a',
          secondary: '#334155',
          muted:     '#64748b',
        },
        border: {
          subtle: 'rgba(15,23,42,0.08)',
          accent: 'rgba(79,70,229,0.22)',
        },
        /* ── Dark futuristic (landing / auth) ── */
        night: {
          base:    '#02050f',
          surface: '#080d1e',
          card:    '#0d1427',
          border:  'rgba(99,102,241,0.18)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'gradient-rotate': 'gradientRotate 4s linear infinite',
        'mesh-drift':      'meshDrift 8s ease-in-out infinite alternate',
        'pulse-dot':       'pulseDot 2s cubic-bezier(0.4,0,0.6,1) infinite',
        shimmer:           'shimmer 1.5s infinite',
        'fade-in-up':      'fadeInUp 0.5s ease-out forwards',
        'scan-pulse':      'scanPulse 1.5s ease-in-out infinite',
        'fade-in-down':    'fadeInDown 0.45s ease-out forwards',
        'slide-left':      'slideInLeft 0.4s ease-out forwards',
        'slide-right':     'slideInRight 0.4s ease-out forwards',
        float:             'float 6s ease-in-out infinite',
        'float-slow':      'float 9s ease-in-out infinite',
        'float-orb':       'floatOrb 10s ease-in-out infinite alternate',
        'glow-pulse':      'glowPulse 3s ease-in-out infinite',
        'rotate-ring':     'rotateRing 14s linear infinite',
        'counter-rotate':  'counterRotateRing 9s linear infinite',
        'rotate-ring-fast':'rotateRing 5s linear infinite',
        'pop-in':          'popIn 0.45s ease-out forwards',
        'border-glow':     'borderGlow 2.5s ease-in-out infinite',
        'scan-down':       'scanDown 2.5s ease-in-out infinite',
        wiggle:            'wiggle 0.5s ease-in-out',
        'bounce-sm':       'bounceSm 0.6s ease-in-out',
        'scale-pulse':     'scalePulse 2.4s ease-in-out infinite',
        'swipe-up':        'swipeUp 0.4s ease-out forwards',
        'aurora-drift':    'auroraDrift 10s ease-in-out infinite alternate',
        'typing':          'typing 3.5s steps(40,end) forwards',
        'blink':           'blink 0.75s step-end infinite',
        'neon-flicker':    'neonFlicker 3s ease-in-out infinite',
        'slide-up':        'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'slide-down-fade': 'slideDownFade 0.4s ease-out forwards',
        'counter':         'counterPop 0.6s cubic-bezier(0.16,1,0.3,1) forwards',
        'card-enter':      'cardEnter 0.5s cubic-bezier(0.16,1,0.3,1) forwards',
        'pulse-ring':      'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'gradient-x':      'gradientX 5s ease infinite',
        'orb-1':           'floatOrb 12s ease-in-out infinite alternate',
        'orb-2':           'floatOrb 9s ease-in-out infinite alternate-reverse',
        'orb-3':           'floatOrb 15s ease-in-out infinite alternate',
      },
      keyframes: {
        gradientRotate: {
          '0%':   { backgroundPosition: '0% 50%'   },
          '50%':  { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%'   },
        },
        meshDrift: {
          '0%':   { backgroundPosition: '0% 0%'     },
          '100%': { backgroundPosition: '100% 100%' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1',   transform: 'scale(1)'   },
          '50%':      { opacity: '0.3', transform: 'scale(0.8)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0'  },
        },
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        fadeInDown: {
          from: { opacity: '0', transform: 'translateY(-16px)' },
          to:   { opacity: '1', transform: 'translateY(0)'     },
        },
        slideInLeft: {
          from: { opacity: '0', transform: 'translateX(-24px)' },
          to:   { opacity: '1', transform: 'translateX(0)'     },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
        scanPulse: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)'    },
          '50%':      { opacity: '1',   transform: 'scale(1.15)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)'   },
          '50%':      { transform: 'translateY(-10px)' },
        },
        floatOrb: {
          '0%':   { transform: 'translateY(0px) translateX(0px)',    opacity: '0.7' },
          '33%':  { transform: 'translateY(-28px) translateX(16px)', opacity: '0.9' },
          '66%':  { transform: 'translateY(14px) translateX(-12px)', opacity: '0.6' },
          '100%': { transform: 'translateY(-8px) translateX(8px)',   opacity: '0.8' },
        },
        glowPulse: {
          '0%, 100%': {
            boxShadow: '0 4px 20px rgba(79,70,229,0.08), 0 0 0 1px rgba(79,70,229,0.06)',
          },
          '50%': {
            boxShadow: '0 8px 32px rgba(79,70,229,0.18), 0 0 0 1px rgba(79,70,229,0.14)',
          },
        },
        rotateRing: {
          from: { transform: 'rotate(0deg)'   },
          to:   { transform: 'rotate(360deg)' },
        },
        counterRotateRing: {
          from: { transform: 'rotate(0deg)'    },
          to:   { transform: 'rotate(-360deg)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.84)' },
          '70%':  { transform: 'scale(1.03)'               },
          '100%': { opacity: '1', transform: 'scale(1)'    },
        },
        borderGlow: {
          '0%, 100%': { borderColor: 'rgba(79,70,229,0.20)' },
          '50%':      { borderColor: 'rgba(79,70,229,0.50)' },
        },
        scanDown: {
          '0%':   { top: '0%',   opacity: '0' },
          '10%':  { opacity: '1'              },
          '90%':  { opacity: '1'              },
          '100%': { top: '100%', opacity: '0' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%':      { transform: 'rotate(3deg)'  },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)'    },
          '40%':      { transform: 'translateY(-6px)' },
          '70%':      { transform: 'translateY(-3px)' },
        },
        scalePulse: {
          '0%, 100%': { transform: 'scale(1)'    },
          '50%':      { transform: 'scale(1.04)' },
        },
        swipeUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        auroraDrift: {
          '0%':   { backgroundPosition: '0% 50%'   },
          '50%':  { backgroundPosition: '100% 25%' },
          '100%': { backgroundPosition: '50% 100%' },
        },
        typing: {
          from: { width: '0' },
          to:   { width: '100%' },
        },
        blink: {
          '0%, 100%': { borderColor: 'transparent' },
          '50%':      { borderColor: '#6366f1'     },
        },
        neonFlicker: {
          '0%, 19%, 21%, 23%, 25%, 54%, 56%, 100%': { textShadow: '0 0 18px rgba(99,102,241,0.8), 0 0 40px rgba(99,102,241,0.4)' },
          '20%, 24%, 55%':                           { textShadow: 'none' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)'    },
        },
        slideDownFade: {
          from: { opacity: '0', transform: 'translateY(-12px)' },
          to:   { opacity: '1', transform: 'translateY(0)'     },
        },
        counterPop: {
          '0%':   { opacity: '0', transform: 'scale(0.6)' },
          '70%':  { transform: 'scale(1.08)'              },
          '100%': { opacity: '1', transform: 'scale(1)'   },
        },
        cardEnter: {
          from: { opacity: '0', transform: 'translateY(32px) scale(0.97)' },
          to:   { opacity: '1', transform: 'translateY(0) scale(1)'       },
        },
        pulseRing: {
          '0%':   { transform: 'scale(1)',    opacity: '1'   },
          '100%': { transform: 'scale(2.2)', opacity: '0'   },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%'   },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },
      backdropBlur: {
        '3xl': '64px',
      },
      boxShadow: {
        'glow-indigo': '0 0 20px rgba(79,70,229,0.12), 0 0 50px rgba(79,70,229,0.04)',
        'glow-sm':     '0 0 12px rgba(79,70,229,0.14)',
        'card-xl':     '0 20px 60px rgba(0,0,0,0.10)',
        'inner-glow':  'inset 0 0 24px rgba(79,70,229,0.04)',
        'card-lift':   '0 8px 32px rgba(79,70,229,0.10), 0 2px 8px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
}
