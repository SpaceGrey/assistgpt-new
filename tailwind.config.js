/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.vue",
  ],
  theme: {
    extend: {
      borderRadius: {
        '1/2': '50%'
      },
      maxHeight: {
        '108px': '108px'
      }
    },
  },
  plugins: [],
  prefix: 'tw-'
}

