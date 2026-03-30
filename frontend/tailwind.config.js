/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#faf5ff", 100:"#f3e8ff", 500:"#a855f7", 600:"#9333ea", 700:"#7e22ce", 900:"#4a044e" },
        surface: "#f8f7ff",
      },
    },
  },
  plugins: [],
};
