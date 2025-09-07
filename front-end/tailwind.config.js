/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 1s ease-out',
      },
      backgroundImage: {
        'background-image': "url('/Users/saratbehera/Downloads/Eagle-View-main/front-end/public/background.png')", 
        'grid': "url('/grid.svg')", // Adjust path if needed
      },
      fontFamily: {
        'system': [
          '-apple-system', 
          'BlinkMacSystemFont', 
          'Segoe UI', 
          'Roboto', 
          'Oxygen', 
          'Ubuntu', 
          'Cantarell', 
          'Open Sans', 
          'Helvetica Neue', 
          'sans-serif'
        ]
      },
      colors: {
        // Custom color palette
        'apple-gray': {
          50: '#f5f5f7',
          100: '#e5e5e5',
          900: '#1a1a1a'
        }
      },
      boxShadow: {
        'apple-card': '0 10px 25px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
