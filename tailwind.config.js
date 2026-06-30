/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        houde: {
          green: "#d946ef",
          cyan: "#a78bfa",
          blue: "#6366f1",
          ink: "#05030a",
        },
      },
      boxShadow: {
        glow: "0 0 42px rgba(167, 139, 250, 0.22)",
        card: "0 20px 60px rgba(0, 0, 0, 0.24)",
      },
      backgroundImage: {
        "houde-radial":
          "radial-gradient(circle at 16% 18%, rgba(124, 58, 237, 0.24), transparent 30%), radial-gradient(circle at 78% 8%, rgba(217, 70, 239, 0.18), transparent 32%), linear-gradient(135deg, #05030a 0%, #0b0614 48%, #05030a 100%)",
      },
    },
  },
  plugins: [],
};
