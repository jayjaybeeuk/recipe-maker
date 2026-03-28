/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
    './infra/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fdf8f0',
          100: '#faefd9',
          200: '#f4dbb0',
          300: '#ecc27c',
          400: '#e4a24a',
          500: '#dc8a2a', // primary
          600: '#c97020',
          700: '#a8551c',
          800: '#87441e',
          900: '#6e381c',
        },
        surface: {
          DEFAULT: '#fdf8f0',
          muted: '#f5efe3',
        },
      },
    },
  },
  plugins: [],
}
