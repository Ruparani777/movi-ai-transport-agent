import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#E5F4FF",
          100: "#B8E1FF",
          200: "#8BCCFF",
          300: "#5EB6FF",
          400: "#31A0FF",
          500: "#1786E6",
          600: "#1068B4",
          700: "#0A4A82",
          800: "#042D51",
          900: "#001021"
        }
      },
      boxShadow: {
        card: "0 20px 45px -15px rgba(23, 134, 230, 0.3)"
      }
    }
  },
  plugins: []
};

export default config;

