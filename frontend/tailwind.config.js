/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: { ink: '#0b1220', brand: '#635bff', mist: '#f5f7fb' },
    boxShadow: { soft: '0 12px 40px rgba(15, 23, 42, .07)' }
  }},
  plugins: [],
}
