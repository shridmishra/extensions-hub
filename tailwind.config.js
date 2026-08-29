/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{ts,tsx,html}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["\"Satoshi\"", "\"Google Sans Flex\"", "\"Google Sans\"", "Roboto", "Arial", "sans-serif"],
        display: ["\"Satoshi\"", "\"Google Sans Flex\"", "\"Google Sans\"", "Roboto", "Arial", "sans-serif"],
        mono: ["\"Geist Mono\"", "\"SF Mono\"", "ui-monospace", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      colors: {
        neutral: {
          750: '#333338',
          850: '#1c1c20',
        },
        hub: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#1c1c20',
          900: '#18181b',
          950: '#09090b',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      }
    }
  }
}
