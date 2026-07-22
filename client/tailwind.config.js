/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        'btn': '#999999',
        'btn-hover': 'rgba(100, 100, 255, 0.45)',
        'text-white': '#FCFCFC',
        'text-white-hover': '#FFFFA0',
        'text-gray': '#3f3f3f',
        'card': '#c6c6c6',
        'input': '#8b8b8b',
        'input-hover': '#aaa',
        'gray': '#555',
      },
      backgroundImage: {
        'btn': "var(--bg-btn)",
        'minecraft': "var(--bg-minecraft)",
      },
      boxShadow: {
        'btn': 'inset -2px -3px rgba(0, 0, 0, 0.4), inset 2px 2px rgba(255, 255, 255, 0.7)',
        'btn-active': 'inset -2px -3px rgba(0, 0, 0, 0.2), inset 2px 2px rgba(255, 255, 255, 0.3)',
      },
      fontFamily: {
        'minecraft': ['MinecraftRegular', 'sans-serif'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }) {
      const newUtilities = {
        '.mc-button': {
          userSelect: 'none',
          imageRendering: 'pixelated',
          border: '2px solid #000',
        },
        '.mc-button-title': {
          paddingBottom: '0.1em',
          textShadow: '2px 2px rgba(0, 0, 0, 0.5)',
          boxShadow: 'theme("boxShadow.btn")',
        },
        '.mc-button:hover .mc-button-title': {
          backgroundColor: 'theme("colors.btn-hover")',
          textShadow: '2px 2px rgba(32, 32, 19, 0.8)',
          color: 'theme("colors.text-white-hover")',
        },
        '.mc-button:active .mc-button-title': {
          boxShadow: 'theme("boxShadow.btn-active")',
        },
      };
      addUtilities(newUtilities, ['responsive', 'hover', 'active']);
    },
    function({ addBase }) {
      addBase({
        ':root': {
          '--bg-btn': "url('../assets/optimized/minecraft-btn.jpg')",
          '--bg-minecraft': "url('../assets/optimized/minecraft-bg.jpg')",
          '@supports (background-image: url("../assets/optimized/minecraft-btn.webp"))': {
            '--bg-btn': "url('../assets/optimized/minecraft-btn.webp')",
          },
          '@supports (background-image: url("../assets/optimized/minecraft-bg.webp"))': {
            '--bg-minecraft': "url('../assets/optimized/minecraft-bg.webp')",
          },
        },
      });
    },
  ],
}