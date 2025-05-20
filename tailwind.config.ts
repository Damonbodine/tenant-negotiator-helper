
import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        raleway: ["Raleway", "Arial", "sans-serif"],
        playfair: ["Playfair Display", "serif"],
        sans: ["var(--font-sans)"],
        serif: ["var(--font-serif)"],
        mono: ["var(--font-mono)"],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0'
          },
          to: {
            height: 'var(--radix-accordion-content-height)'
          }
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)'
          },
          to: {
            height: '0'
          }
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-slow': 'pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: 'white',
            a: {
              color: '#5CFFFF',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            strong: {
              color: 'white',
              fontWeight: '600',
            },
            h1: {
              color: 'white',
              fontSize: '1.5rem',
              marginBottom: '1rem'
            },
            h2: {
              color: 'white',
              fontSize: '1.25rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem'
            },
            h3: {
              color: 'white',
              fontSize: '1.125rem',
              marginTop: '1.25rem',
              marginBottom: '0.5rem'
            },
            h4: {
              color: 'white',
            },
            p: {
              color: 'white',
            },
            li: {
              color: 'white',
            },
            blockquote: {
              color: 'white',
              borderLeftColor: 'rgba(255, 255, 255, 0.2)',
            },
            code: {
              color: 'white',
              background: 'rgba(255, 255, 255, 0.1)',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontFamily: 'monospace',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '0',
              color: 'white',
            },
            pre: {
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '0.375rem',
              padding: '1em',
              overflow: 'auto',
              color: 'white',
            },
            'ul > li': {
              paddingLeft: '1.5em',
              color: 'white',
            },
            'ul > li::before': {
              width: '0.5em',
              height: '0.5em',
              top: 'calc(0.875em - 0.0625em)',
              left: '0.25em',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
            },
            'ol > li': {
              paddingLeft: '1.5em',
              color: 'white',
            },
            'ol > li::before': {
              color: 'white',
            },
          },
        },
      },
    }
  },
  plugins: [require("tailwindcss-animate"), typography],
} satisfies Config;
