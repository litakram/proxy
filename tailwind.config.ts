import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0d1117',
          soft: '#3d444d',
          muted: '#656d76',
          faint: '#8b949e',
        },
        line: {
          DEFAULT: '#e4e7eb',
          soft: '#eef0f3',
        },
        canvas: {
          DEFAULT: '#ffffff',
          subtle: '#fafbfc',
          inset: '#f5f6f8',
        },
        brand: {
          50: '#f0f3ff',
          100: '#e3e9ff',
          200: '#ccd6ff',
          300: '#a8b8ff',
          400: '#7f90fb',
          500: '#5b68f2',
          600: '#4547e0',
          700: '#3838c4',
          800: '#30319e',
          900: '#2d307d',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13,17,23,0.04), 0 1px 3px rgba(13,17,23,0.06)',
        lift: '0 4px 12px rgba(13,17,23,0.06), 0 12px 32px rgba(13,17,23,0.08)',
        pop: '0 8px 24px rgba(69,71,224,0.18)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.9)', opacity: '0.7' },
          '70%': { transform: 'scale(1.6)', opacity: '0' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        blink: {
          '0%, 100%': { opacity: '0.25' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.28s ease-out both',
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        blink: 'blink 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
