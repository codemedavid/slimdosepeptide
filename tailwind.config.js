/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Black, White, and Gold Theme
        primary: {
          50: '#fafafa',   // Off-white
          100: '#f5f5f5',  // Light gray
          200: '#e5e5e5',  // Soft gray
          300: '#d4d4d4',  // Medium gray
          400: '#a3a3a3',  // Gray
          500: '#737373',  // Dark gray
          600: '#525252',  // Darker gray
          700: '#404040',  // Very dark gray
          800: '#262626',  // Almost black
          900: '#171717',  // Pure black
        },
        gold: {
          50: '#fffbeb',   // Lightest gold
          100: '#fef3c7',  // Very light gold
          200: '#fde68a',  // Light gold
          300: '#fcd34d',  // Soft gold
          400: '#fbbf24',  // Medium gold
          500: '#f59e0b',  // Standard gold
          600: '#d97706',  // Rich gold
          700: '#b45309',  // Deep gold
          800: '#92400e',  // Dark gold
          900: '#78350f',  // Darkest gold
        },
        accent: {
          light: '#fbbf24',   // Light gold accent
          DEFAULT: '#f59e0b', // Main gold accent
          dark: '#d97706',    // Rich gold accent
          white: '#ffffff',   // Pure white
          black: '#000000',   // Pure black
        },
        gray: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        elegant: ['Playfair Display', 'serif'], // Optional elegant serif font
      },
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.05)',
        'medium': '0 4px 20px rgba(0, 0, 0, 0.1)',
        'large': '0 8px 30px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(245, 158, 11, 0.3)',
        'luxury': '0 4px 15px rgba(245, 158, 11, 0.2)',
        'gold-glow': '0 0 30px rgba(245, 158, 11, 0.4)',
      },
      animation: {
        'fadeIn': 'fadeIn 0.4s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gold-glow': 'goldGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        goldGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(245, 158, 11, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
