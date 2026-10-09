/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          DEFAULT: '#242321', // Primary dark backgrounds and navigation
          dark: '#191817',    // Deep Charcoal - page backgrounds
          light: '#2E2C2A',
          surface: '#242321',
        },
        earth: {
          DEFAULT: '#594538', // Secondary surfaces, cards, and subtle borders
          dark: '#3E3128',
          light: '#735B4B',
          border: '#594538',
        },
        amber: {
          DEFAULT: '#C47A35', // Burnt Amber - primary accent, buttons, active states
          hover: '#D48944',
          dark: '#A36024',
          light: '#E6A265',
        },
        cream: {
          DEFAULT: '#F0E6D8', // Warm Cream - primary text on dark backgrounds
          muted: '#E2D5C3',
        },
        taupe: {
          DEFAULT: '#B5A493', // Muted Taupe - secondary text and supporting labels
          light: '#C8BAAB',
          dark: '#8E7D6E',
        },
        priority: {
          critical: '#42201D',
          criticalText: '#FFA494',
          criticalBorder: '#73352E',
          high: '#3D2517',
          highText: '#F5A962',
          highBorder: '#7A4526',
          medium: '#382D1D',
          mediumText: '#EBC57A',
          mediumBorder: '#6E542C',
          low: '#233327',
          lowText: '#9CD4A8',
          lowBorder: '#3B5942',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0, 0, 0, 0.45)',
        card: '0 2px 8px 0 rgba(0, 0, 0, 0.3)',
        amber: '0 0 16px rgba(196, 122, 53, 0.25)',
      }
    },
  },
  plugins: [],
}
