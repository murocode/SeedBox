/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#e6edff',
          200: '#c6d4ff',
          300: '#9eb2ff',
          400: '#6f85ff',
          500: '#495bff',
          600: '#3346e6',
          700: '#2a38b4',
          800: '#202b82',
          900: '#171d51'
        }
        ,
        accent: '#06b6d4'
      }
    }
  },
  plugins: []
}
