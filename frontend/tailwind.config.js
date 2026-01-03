export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-up': 'fade-slide-up 0.3s ease forwards',
      },
    },
  },
  plugins: [],
}