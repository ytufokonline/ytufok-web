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
          bg: '#12080f',           // En derin arka plan (koyu mürdüm gece)
          card: '#1c0f18',         // Kart ve panel zemini
          cardHover: '#251621',    // Kart hover
          plum: '#301322',         // Kulüp 1. Ana Rengi (Mürdüm / Vişne)
          plumHover: '#421d31',    // Mürdüm açık ton
          wine: '#4b253b',         // Şarap / erik tonu
          twilight: '#4e3b52',     // Ara geçiş tonu 1
          dusk: '#584964',         // Ara geçiş tonu 2
          steelMuted: '#5b657e',   // Dumanlı çelik tonu
          steel: '#657796',        // Kulüp 2. Ana Rengi (Çelik Mavisi / Slate Blue)
          steelLight: '#8193b2',   // Açık çelik vurgu
          steelSoft: '#a9b9d3',    // Yumuşak lavanta çelik
          steelIce: '#dce4ef',     // Buzlu çelik açık metin
        }
      },
      fontFamily: {
        sans: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', '"ITC Avant Garde Gothic"', 'sans-serif'],
        club: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', '"ITC Avant Garde Gothic"', 'sans-serif'],
        mono: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', 'sans-serif'],
        heading: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', 'sans-serif'],
        body: ['"Century Gothic"', 'CenturyGothic', 'AppleGothic', 'sans-serif']
      }
    },
  },
  plugins: [],
}
