/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ytufok: {
          bg: '#1c020d',           // En derin ana arka plan (koyu ton)
          text: '#f1f5f9',         // Ana açık metin tonu (nötr mat beyaz)
          card: '#16050e',         // Kart ve panel zemini
          cardHover: '#220816',    // Kart hover
          plum: '#1c020d',         // Kulüp 1. Ana Rengi
          plumHover: '#2c0c1e',    // Açık ton
          wine: '#44142d',         // Şarap / erik tonu
          twilight: '#332135',     // Ara geçiş tonu 1
          dusk: '#3d344d',         // Ara geçiş tonu 2
          slate: '#568aa5',        // Kulüp 2. Ana Rengi (Mavi/Gri ton)
          slateLight: '#6ea5c4',   // Açık parlayan mavi ton
          slateGlow: '#8fc0da',    // Parlayan baloncuk tonu
          steelMuted: '#476579',   // Dumanlı çelik tonu
          steel: '#568aa5',        // Kulüp 2. Ana Rengi (Çelik Mavisi / Slate Blue)
          steelLight: '#6ea5c4',   // Açık çelik vurgu
          steelSoft: '#8fb1c7',    // Yumuşak lavanta çelik
          steelIce: '#f1f5f9',     // Asil açık metin
        }
      },
      fontFamily: {
        sans: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        body: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        heading: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        club: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        satoshi: ['Satoshi', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
