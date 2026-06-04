/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: '#1a1f1a',
        cream: '#faf7f2',
        bone: '#f5f0e8',
        sage: {
          50:  '#f4f7f4',
          100: '#e6ede5',
          200: '#cdd9cb',
          300: '#a8bda4',
          400: '#7d9a78',
          500: '#5a7c56',
          600: '#456343',
          700: '#384f37',
          800: '#2d3f2c',
          900: '#1f2b1f',
        },
        accent: '#c97b4a',
      },
      boxShadow: {
        'soft': '0 1px 2px rgba(26,31,26,0.04), 0 4px 12px rgba(26,31,26,0.04)',
        'medium': '0 4px 16px rgba(26,31,26,0.06), 0 12px 32px rgba(26,31,26,0.06)',
      },
    },
  },
  plugins: [],
};
