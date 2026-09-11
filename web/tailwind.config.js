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
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        emergency: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#eab308',
          low: '#3b82f6',
        },
        dark: {
          950: '#070b14',
          900: '#0b1120',
          850: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'beacon': 'beacon 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        beacon: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
