/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',
          card: 'rgba(30, 41, 59, 0.6)',
          border: 'rgba(255, 255, 255, 0.05)',
        },
        brand: {
          primary: '#6366F1',
          secondary: '#8B5CF6',
          accent: '#EC4899',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444'
        }
      },
      backdropBlur: {
        xs: '2px',
        md: '12px'
      }
    },
  },
  plugins: [],
}
