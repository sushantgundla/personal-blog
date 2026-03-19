/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        headline: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        label: ['JetBrains Mono', 'monospace'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        surface: {
          DEFAULT: 'var(--surface)',
          dim: 'var(--surface-dim)',
          bright: 'var(--surface-bright)',
          container: {
            DEFAULT: 'var(--surface-container)',
            low: 'var(--surface-container-low)',
            high: 'var(--surface-container-high)',
            highest: 'var(--surface-container-highest)',
            lowest: 'var(--surface-container-lowest)',
          },
          variant: 'var(--surface-variant)',
          tint: 'var(--primary)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          container: 'var(--primary)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          container: 'var(--secondary-container)',
        },
        tertiary: {
          DEFAULT: 'var(--tertiary)',
          container: 'var(--tertiary-container)',
        },
        outline: {
          DEFAULT: 'var(--outline)',
          variant: 'var(--outline-variant)',
        },
        on: {
          surface: {
            DEFAULT: 'var(--on-surface)',
            variant: 'var(--on-surface-variant)',
          },
          primary: {
            DEFAULT: 'var(--on-primary)',
            container: 'var(--on-primary-container)',
          },
        },
        background: 'var(--surface)',
        'inverse-surface': 'var(--inverse-surface)',
        'inverse-on-surface': 'var(--inverse-on-surface)',
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.5rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 107, 43, 0.15)',
        'glow-lg': '0 0 40px rgba(255, 107, 43, 0.1)',
        'ambient': '0px 12px 32px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}
