import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#000000',
        'bone-white': '#ffffff',
        'ash-gray': '#9a9a9a',
        'silver-mist': '#bdbdbd',
        'electric-iris': {
          DEFAULT: '#8052ff',
          hover: '#6d3cf5',
          glow: 'rgba(128, 82, 255, 0.35)',
        },
        'saffron-spark': {
          DEFAULT: '#ffb829',
          hover: '#e5a31f',
        },
        'deep-verdant': {
          DEFAULT: '#15846e',
          light: '#1ea88d',
        },
        surface: {
          void: '#000000',
          elevated: '#0a0a0a',
          subtle: '#111111',
          border: 'rgba(255, 255, 255, 0.08)',
        },
      },
      fontFamily: {
        display: ['PPNeueMontreal', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['PPNeueMontreal', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'display': '-4.52px',
        'heading-lg': '-3.12px',
        'heading-sm': '-1.68px',
        'heading-2xs': '-0.48px',
        'nav': '0.35px',
      },
      borderRadius: {
        '24': '24px',
        'pill': '9999px',
      },
      boxShadow: {
        'iris-glow': '0 0 25px rgba(128, 82, 255, 0.45)',
        'verdant-glow': '0 0 25px rgba(21, 132, 110, 0.45)',
        'saffron-glow': '0 0 20px rgba(255, 184, 41, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float-slow': 'float 8s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
