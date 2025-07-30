/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#C4000C",
        "brand-light": "#E04A45",
        "brand-lighter": "#FFD1D1",
        "brand-bg": "#f9f9f9",
        accent: "#6B7280",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
}
