/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Primary brand colors
        primary: {
          DEFAULT: 'hsl(var(--color-primary))',
          hover: 'hsl(var(--color-primary-hover))',
          light: 'hsl(var(--color-primary-light))',
          foreground: 'hsl(var(--color-primary-foreground))',
        },
        // Background colors
        'bg-main': 'hsl(var(--color-bg-main))',
        'bg-subtle': 'hsl(var(--color-bg-subtle))',
        'bg-muted': 'hsl(var(--color-bg-muted))',
        'bg-card': 'hsl(var(--color-bg-card))',
        'bg-popover': 'hsl(var(--color-bg-popover))',
        'bg-hero': 'hsl(var(--color-bg-hero))',
        // Text colors
        'text-base': 'hsl(var(--color-text-base))',
        'text-muted': 'hsl(var(--color-text-muted))',
        'text-subtle': 'hsl(var(--color-text-subtle))',
        'text-inverted': 'hsl(var(--color-text-inverted))',
        // Border colors
        'border-default': 'hsl(var(--color-border-default))',
        'border-muted': 'hsl(var(--color-border-muted))',
        'border-input': 'hsl(var(--color-border-input))',
        // Semantic colors
        destructive: {
          DEFAULT: 'hsl(var(--color-destructive))',
          foreground: 'hsl(var(--color-destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--color-success))',
          foreground: 'hsl(var(--color-success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--color-warning))',
          foreground: 'hsl(var(--color-warning-foreground))',
        },
        // Component-specific
        ring: 'hsl(var(--color-ring))',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius)',
        sm: 'var(--radius-sm)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'soft-md': '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'soft-lg': '0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
      },
      keyframes: {
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        'spin-slow': 'spin-slow 1.5s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
