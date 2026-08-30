import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      /* ── shadcn CSS Variable Colors ── */
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        /* ── DressCave Brand Colors ── */
        brand: {
          bg: {
            page: "#FAFAFA",
            surface: "#F5F5F3",
            card: "#FFFFFF",
            border: "#E5E5E0",
          },
          text: {
            primary: "#4A4A4A",
            secondary: "#6B6B6B",
            muted: "#858585",
            heading: {
              primary: "#1A1A1A",
              secondary: "#2D2D2D",
              tertiary: "#404040",
            },
          },
          accent: {
            whatsapp: "#25D366",
            primary: "#1A1A1A",
            price: "#E63946",
            gold: "#FFD166",
            success: "#06D6A0",
            warning: "#FFD166",
            error: "#EF476F",
          },
        },
      },

      /* ── Extra Ring Width for shadcn v4 compat ── */
      ringWidth: {
        "3": "3px",
      },

      /* ── Font Family ── */
      fontFamily: {
        heading: ["Playfair Display", "serif"],
        body: ["Inter", "sans-serif"],
      },

      /* ── Spacing ── */
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
        "30": "7.5rem",
        "44": "11rem",
      },

      /* ── Typography ── */
      fontSize: {
        display: ["2rem", { lineHeight: "1.2", fontWeight: "700" }],
        h2: ["1.625rem", { lineHeight: "1.3", fontWeight: "600" }],
        h3: ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        h4: ["1.125rem", { lineHeight: "1.5", fontWeight: "600" }],
        body: ["1rem", { lineHeight: "1.6", fontWeight: "400" }],
        caption: [
          "0.875rem",
          { lineHeight: "1.5", fontWeight: "400" },
        ],
        label: [
          "0.75rem",
          {
            lineHeight: "1.4",
            fontWeight: "400",
            letterSpacing: "0.02em",
          },
        ],
      },

      /* ── 44px Touch Targets ── */
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },

      /* ── 60fps Animations ── */
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "skeleton-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 200ms ease-out",
        "fade-in-up": "fade-in-up 250ms ease-out",
        "slide-up": "slide-up 300ms ease-out",
        "slide-down": "slide-down 300ms ease-in",
        "skeleton-pulse": "skeleton-pulse 1.5s ease-in-out infinite",
        "scale-in": "scale-in 200ms ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
