/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'cohenix': {
          50: '#f0f6ff',
          100: '#e0edff',
          200: '#c7ddff',
          300: '#a3c7ff',
          400: '#799fff',
          500: '#4c6dff',
          600: '#1e3fff',
          700: '#0026ff',
          800: '#0024eb',
          900: '#001db8',
          950: '#000c66',
        },
        'cohenix-dark': '#000B3D',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'cohenix-gradient': 'linear-gradient(90deg, rgb(18,56,176) 0%, rgb(18,128,233) 100%)',
      },
      height: {
        screen: ['100vh', '100dvh']
      },
      minHeight: {
        screen: ['100vh', '100dvh']
      }
    },
  },
  plugins: [],
};