import tailwindcssAnimate from 'tailwindcss-animate'
import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      padding: {
        'safe': 'env(safe-area-inset-top)',
      },
      margin: {
        'safe': 'env(safe-area-inset-top)',
      },
      height: {
        'dvh': '100dvh',
      },
      maxHeight: {
        'dvh': '100dvh',
      },
      minHeight: {
        'dvh': '100dvh',
      },
      fontFamily: {
        display: ["'Inter'", 'sans-serif'],
        sans: ["'Inter'", 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'small-ping': {
          '75%, 100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'small-ping': 'small-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        blob: 'blob 9s infinite',
        shimmer: 'shimmer 2.5s linear infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate, daisyui],
  daisyui: {
    themes: [
      {
        gatherup: {
          primary: '#008080',
          'primary-content': '#ffffff',
          secondary: '#6332dc',
          accent: '#00b48c',
          neutral: '#1f2937',
          'base-100': '#ffffff',
          'base-200': '#f7f8fa',
          'base-300': '#eef0f2',
          info: '#3b82f6',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          '--rounded-box': '1rem',
          '--rounded-btn': '0.75rem',
        },
      },
      'gatherup',
    ],
    darkTheme: 'gatherup',
    logs: false,
  },
}
