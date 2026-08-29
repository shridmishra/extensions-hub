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
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'xs': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'sm': '0 2px 5px 0 rgba(0, 0, 0, 0.08), 0 1px 3px -1px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'lg': '0 10px 20px -3px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 16px 32px -4px rgba(0, 0, 0, 0.14), 0 6px 16px -2px rgba(0, 0, 0, 0.06)',
        '2xl': '0 24px 48px -6px rgba(0, 0, 0, 0.18), 0 12px 24px -4px rgba(0, 0, 0, 0.08)',
      }
    }
  }
}
