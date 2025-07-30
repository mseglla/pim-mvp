/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#3f3f46",
        "brand-light": "#52525b",
        "brand-lighter": "#e4e4e7",
        "brand-bg": "#f9f9f9",
        accent: "#f97316",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
