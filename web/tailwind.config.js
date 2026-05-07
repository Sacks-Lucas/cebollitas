/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        argentina: {
          celeste: '#75AADB',
          celesteDark: '#5B8FBF',
          white: '#FFFFFF',
          gold: '#FCBF49',
          navy: '#0E1A2B',
          navyDeep: '#0A1422',
          black: '#000000',
        },
      },
    },
  },
  plugins: [],
}
