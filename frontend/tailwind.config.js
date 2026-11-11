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
        brand: {
          dark: '#0b0f19',
          card: '#131b2e',
          cardHover: '#1a243d',
          border: '#23304e',
          accent: '#3b82f6',
          emerald: '#10b981',
          gold: '#f59e0b',
          rose: '#f43f5e'
        }
      }
    },
  },
  plugins: [],
}
