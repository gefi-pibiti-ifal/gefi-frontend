import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2ECC71',
        'sidebar-dark': '#001a33',
        'sidebar-light': '#0d2b45',
        'text-dark': '#1a1a1a',
        'text-light': '#666666',
        'border-light': '#e0e0e0',
        'message-user': '#001a33',
        'message-ai': '#f5f5f5',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      spacing: {
        'sidebar': '272px',
      },
    },
  },
  plugins: [],
};

export default config;