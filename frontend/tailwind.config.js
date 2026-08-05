/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0A0E13",
        panel: "#12181F",
        panelAlt: "#161D25",
        border: "#232B35",
        cyan: "#46D7C7",
        amber: "#F2A93B",
        danger: "#E5484D",
        muted: "#7C8896",
      },
    },
  },
  plugins: [],
};
