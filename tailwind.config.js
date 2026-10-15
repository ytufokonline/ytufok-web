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
        white: '#eed1d1',
        ytufok: {
          bg: '#500b27',           // En derin arka plan (mürdüm/bordo tonu)
          text: '#eed1d1',         // Ana açık metin tonu
          card: '#3b081d',         // Kart ve panel zemini
          cardHover: '#440921',    // Kart hover
          plum: '#500b27',         // Kulüp 1. Ana Rengi
          plumHover: '#5f0f30',    // Açık ton
          wine: '#6a1237',         // Şarap / erik tonu
          twilight: '#4e3b52',     // Ara geçiş tonu 1
          dusk: '#584964',         // Ara geçiş tonu 2
          steelMuted: '#5b657e',   // Dumanlı çelik tonu
          steel: '#657796',        // Kulüp 2. Ana Rengi (Çelik Mavisi / Slate Blue)
          steelLight: '#8193b2',   // Açık çelik vurgu
          steelSoft: '#a9b9d3',    // Yumuşak lavanta çelik
          steelIce: '#eed1d1',     // Yumuşak pudra açık metin
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
