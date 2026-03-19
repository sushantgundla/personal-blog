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
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          hover: 'var(--bg-hover)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        border: {
          DEFAULT: 'var(--border)',
        },
        accent: 'var(--accent)',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'var(--text-secondary)',
            a: { color: 'var(--accent)', textDecoration: 'underline' },
            strong: { color: 'var(--text-primary)', fontWeight: '600' },
            h2: {
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: '600',
              letterSpacing: '-0.02em',
            },
            h3: {
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-display)',
              fontWeight: '600',
            },
            code: {
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              padding: '2px 6px',
              borderRadius: '4px',
              fontWeight: '400',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            blockquote: {
              borderLeftColor: 'var(--accent)',
              color: 'var(--text-secondary)',
            },
          },
        },
      },
    },
  },
  plugins: [],
}
