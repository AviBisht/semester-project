/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAF7F2',
        border: '#E8E2D9',
        surface: '#FFFFFF',
        primary: {
          DEFAULT: '#A9CCE3',
          hover: '#8FBBD9',
          dark: '#1F3A4D',
        },
        secondary: {
          DEFAULT: '#B8D8C4',
          hover: '#A4CBB2',
          dark: '#234A35',
        },
        accent: {
          DEFAULT: '#F2C6CF',
          hover: '#E9AFC0',
          dark: '#6B2B3A',
        },
        priority: {
          critical: '#F8D7DA',
          criticalDark: '#842029',
          high: '#FCE4D6',
          highDark: '#A65319',
          medium: '#FFF2CD',
          mediumDark: '#7A6400',
          low: '#D1E7DD',
          lowDark: '#0F5132',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(31, 58, 77, 0.05)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.03)',
      }
    },
  },
  plugins: [],
}
