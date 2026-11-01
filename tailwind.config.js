/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./index.html'],
  safelist: [{ pattern: /^ph(-fill)?$/ }, { pattern: /^ph-/ }],
  theme: {
    extend: {
      colors: {
        brand: { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309' },
        dark: { bg: '#0f172a', card: '#1e293b', border: '#334155' },
      },
      fontFamily: {
        amiri: ['Amiri', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
