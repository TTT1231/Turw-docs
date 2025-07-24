/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./docs/**/*.{js,ts,vue,md}",
    "./docs/.vitepress/**/*.{js,ts,vue}"
  ],
  prefix: 'tw-',
  theme: {
    extend: {},
  },
  plugins: [],
}