/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#faf9f7',
          100: '#f5f3f0',
          200: '#ebe7e0',
          300: '#ddd6cc',
          400: '#c9beb0',
          500: '#b8a899',
          600: '#a69583',
          700: '#8b7d6e',
          800: '#72685c',
          900: '#5d554b',
        }
      }
    },
  },
  plugins: [],
}
