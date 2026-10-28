/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Core Palette: Olive + Terracotta | Earthy, Fresh, Modern
        ivory: {
          DEFAULT: '#F5F0E5', // Warm ivory canvas
          surface: '#FCFAF6', // Clean elevated surface
          panel: '#EFE9DC',   // Slightly deeper ivory for nested sections
          border: '#DFD8C8',  // Soft warm border
          'border-strong': '#CAC1AE',
        },
        sage: {
          DEFAULT: '#C6CDAA', // Light sage
          light: '#DFE4CD',
          subtle: '#EEF2E6',
          border: '#B2BCA0',
          dark: '#586348',
          text: '#434D37',
        },
        olive: {
          DEFAULT: '#697C58', // Deep olive (primary buttons, active nav, key accents)
          hover: '#576748',
          dark: '#455239',
          light: '#7F936C',
          subtle: '#EFF3EB',
          border: '#BAC7AF',
        },
        terracotta: {
          DEFAULT: '#CF806B', // Muted terracotta (secondary actions, highlights)
          hover: '#BA6E5A',
          dark: '#9F5542',
          light: '#DF9886',
          subtle: '#FAF1EE',
          border: '#E5BFB5',
        },
        charcoal: {
          DEFAULT: '#343B30', // Charcoal green (headings, body text, nav)
          secondary: '#5A6354', // Muted body text
          muted: '#7C8775',   // Subdued metadata & placeholders
          border: '#B8C1B4',
        },
        // Unified legacy/utility aliases mapped to the earthy palette
        brand: {
          DEFAULT: '#697C58', // Deep Olive
          hover: '#576748',
          light: '#7F936C',
          subtle: '#EEF2E6',  // Sage tint
          border: '#B2BCA0',
        },
        canvas: {
          DEFAULT: '#F5F0E5', // Warm Ivory
          surface: '#FCFAF6', // Elevated ivory
          subtle: '#EFE9DC',
          border: '#DFD8C8',
          'border-strong': '#CAC1AE',
        },
        ink: {
          DEFAULT: '#343B30', // Charcoal Green
          secondary: '#5A6354',
          muted: '#7C8775',
        },
        // Semantic emergency response colors (Red, Amber, Orange, Green)
        triage: {
          critical: '#DC2626',
          'critical-bg': '#FEF2F2',
          'critical-border': '#FECACA',
          'critical-text': '#991B1B',
          high: '#EA580C',
          'high-bg': '#FFF7ED',
          'high-border': '#FFEDD5',
          'high-text': '#9A3412',
          medium: '#D97706',
          'medium-bg': '#FFFBEB',
          'medium-border': '#FEF3C7',
          'medium-text': '#92400E',
          low: '#16A34A',
          'low-bg': '#F0FDF4',
          'low-border': '#DCFCE7',
          'low-text': '#166534',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Lora"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(52, 59, 48, 0.05), 0 1px 2px -1px rgba(52, 59, 48, 0.03)',
        subtle: '0 2px 8px 0 rgba(52, 59, 48, 0.05)',
      }
    },
  },
  plugins: [],
}
