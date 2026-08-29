/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme")
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue,mjs}"],
  darkMode: "class", // allows toggling dark mode manually
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
}
