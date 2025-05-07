import { type Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Paleta de colores personalizada exclusiva
    colors: {
      yinmn_blue: { DEFAULT: '#355070', 100: '#0a1016', 200: '#151f2c', 300: '#1f2f43', 400: '#2a3f59', 500: '#355070', 600: '#4a709e', 700: '#7293bc', 800: '#a1b7d3', 900: '#d0dbe9' },
      chinese_violet: { DEFAULT: '#6d597a', 100: '#161218', 200: '#2b2331', 300: '#413549', 400: '#564661', 500: '#6d597a', 600: '#8a739a', 700: '#a896b3', 800: '#c5b9cc', 900: '#e2dce6' },
      china_rose: { DEFAULT: '#b56576', 100: '#261216', 200: '#4c242d', 300: '#723743', 400: '#97495a', 500: '#b56576', 600: '#c38391', 700: '#d2a2ac', 800: '#e1c1c8', 900: '#f0e0e3' },
      light_coral: { DEFAULT: '#e56b6f', 100: '#390a0c', 200: '#721417', 300: '#ac1e23', 400: '#db3238', 500: '#e56b6f', 600: '#ea898c', 700: '#efa7a9', 800: '#f5c4c6', 900: '#fae2e2' },
      buff: { DEFAULT: '#eaac8b', 100: '#3f1e0c', 200: '#7e3b17', 300: '#bd5923', 400: '#de7f4c', 500: '#eaac8b', 600: '#eebda2', 700: '#f2cdb9', 800: '#f6ded0', 900: '#fbeee8' },
    },
    extend: {
      borderRadius: { lg: '0.75rem' },
      boxShadow: { card: '0 4px 6px rgba(0,0,0,0.1)' },
    },
  },
  plugins: [forms],
};

export default config;
