/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zd: {
          green: {
            DEFAULT: '#03363D',
            hover: '#022429',
            light: '#EAF4F4',
          },
          mint: '#1F73B7',
          blue: {
            DEFAULT: '#1F73B7',
            hover: '#144A75',
            light: '#EDF5FC',
          },
          charcoal: '#2F3941',
          slate: '#49545C',
          grey: {
            50: '#F8F9F9',
            100: '#F3F5F5',
            200: '#E9EBED',
            300: '#D8DCDE',
            400: '#C2C8CC',
          }
        }
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          '"SFMono-Regular"',
          'Consolas',
          '"Liberation Mono"',
          'Menlo',
          'Courier',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
}
