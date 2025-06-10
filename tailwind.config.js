/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#475569',
        danger: '#dc2626',
        success: '#16a34a',
        warning: '#ca8a04',
      },
    },
  },
  plugins: [],
}

