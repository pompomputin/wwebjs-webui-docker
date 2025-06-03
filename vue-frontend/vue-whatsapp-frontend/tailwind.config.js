// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'walazy-purple': '#8B5CF6', // Updated to a lighter, more vibrant purple
        'walazy-purple-light': '#A181F8', // Adjusted lighter shade (you can fine-tune)
        // You can add more custom colors here as we identify them
      }
    },
  },
  plugins: [],
}
