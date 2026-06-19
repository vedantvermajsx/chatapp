/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      padding: {
        'safe': 'env(safe-area-inset-top)',
      },
      margin: {
        'safe': 'env(safe-area-inset-top)',
      },
      height: {
        'dvh': '100dvh',
      },
      maxHeight: {
        'dvh': '100dvh',
      },
      minHeight: {
        'dvh': '100dvh',
      }
    },
  },
  plugins: [],
}
