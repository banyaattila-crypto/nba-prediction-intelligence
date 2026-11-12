/** @type {import('tailwindcss').Config} */
// A színek CSS-változókból jönnek (src/index.css), így a világos és a sötét téma egy helyen él.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Big Shoulders Display"', '"Arial Narrow"', 'Impact', 'sans-serif'],
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        board: v('board'),   // az oldal háttere
        paper: v('paper'),   // a táblára tűzött lapok
        ink: v('ink'),       // forrásadat, szöveg
        mute: v('mute'),     // másodlagos szöveg, becsült értékek
        line: v('line'),
        model: v('model'),   // a modell becslése (kék filc)
        market: v('market'), // a piaci ár (narancs filc)
        good: v('good'),
        danger: v('danger'),
      },
      borderColor: { DEFAULT: v('line') },
    },
  },
  plugins: [],
}
