/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    "./utils/**/*.{js,ts,jsx,tsx}",
    "./views/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Roboto Mono', 'monospace'],
        lato: ['Lato', 'sans-serif'],
        oswald: ['Oswald', 'sans-serif'],
        'source-code-pro': ['Source Code Pro', 'monospace'],
        nunito: ['Nunito', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif'],
      },
      colors: {
        'disa-red': '#C8102E',
        'disa-dark-bg': '#111827',
        'disa-dark-card': 'rgba(17, 24, 39, 0.7)',
        'disa-dark-border': 'rgba(255, 255, 255, 0.1)',
        'disa-light-bg': '#f3f4f6',
        'disa-light-card': 'rgba(255, 255, 255, 0.6)',
        'disa-light-border': 'rgba(0, 0, 0, 0.08)',
        'disa-accent-green': '#10B981',
        'disa-accent-yellow': '#F59E0B',
        'disa-accent-blue': '#3b82f6',
        'disa-accent-purple': '#8B5CF6',
      },
    },
  },
  plugins: [],
}