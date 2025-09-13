/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'ox-primary': '#FF0000',
        'ox-secondary': '#FFFFFF',
        'ox-background': '#0A0A0A',
        'ox-surface': '#1A1A1A',
        'ox-accent': '#FFD700',
        'ox-success': '#00FF00',
        'ox-warning': '#FF8C00',
        'ox-error': '#FF0044',
      },
      fontFamily: {
        'display': ['Orbitron', 'sans-serif'],
        'body': ['Inter', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'beat-pulse': 'beat-pulse 0.5s ease-in-out infinite',
        'gesture-trail': 'gesture-trail 0.3s ease-out',
      },
      keyframes: {
        'beat-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'gesture-trail': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(1.5)' },
        },
      },
    },
  },
  plugins: [],
}