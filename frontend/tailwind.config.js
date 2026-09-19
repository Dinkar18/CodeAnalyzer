/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090B',
        surface: '#0F0F12',
        surfaceLight: '#18181B',
        surfaceBorder: '#27272A',
        primary: {
          50: '#F5F7FF',
          100: '#EBF0FE',
          200: '#CEDCFD',
          300: '#A3BFFC',
          400: '#759BFA',
          500: '#4F75F8',
          600: '#3B5BF0',
          700: '#2A45DE',
        },
        accent: '#10B981',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'],
      }
    },
  },
  plugins: [],
}
