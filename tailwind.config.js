import forms from '@tailwindcss/forms'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10253f',
        navy: '#17314f',
        teal: '#2b8a88',
        lagoon: '#7fd1cc',
        mist: '#eef6f7',
        sand: '#f6efe8',
        ambersoft: '#f4b85f',
        success: '#22a06b',
        danger: '#d46a6a',
      },
      boxShadow: {
        soft: '0 18px 40px rgba(16, 37, 63, 0.08)',
        float: '0 16px 30px rgba(43, 138, 136, 0.18)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        display: ['"Sora"', 'sans-serif'],
      },
      backgroundImage: {
        shell:
          'radial-gradient(circle at top left, rgba(127, 209, 204, 0.35), transparent 32%), radial-gradient(circle at top right, rgba(244, 184, 95, 0.18), transparent 26%), linear-gradient(180deg, #f7fbfb 0%, #eef6f7 100%)',
        admin:
          'linear-gradient(135deg, rgba(23,49,79,0.95), rgba(18,73,93,0.92))',
      },
      animation: {
        floaty: 'floaty 8s ease-in-out infinite',
        pulseDot: 'pulseDot 2s ease-in-out infinite',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.7' },
          '50%': { transform: 'scale(1.18)', opacity: '1' },
        },
      },
    },
  },
  plugins: [forms],
}
