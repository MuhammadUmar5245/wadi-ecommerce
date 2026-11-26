import { IBM_Plex_Sans_Arabic, Inter, Plus_Jakarta_Sans } from "next/font/google";

/*
 * All three families are declared in the root layout, but each locale only uses
 * its own (see html[lang] rules in globals.css). Preloading is switched off so
 * English pages don't download Arabic fonts and vice versa — the browser fetches
 * a font only when text on the page actually needs it.
 */

// Variable font: one file covers every weight. Metric-matched fallback keeps swaps stable.
export const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap", preload: false });

// Headings only; "optional" avoids a late swap (and layout shift) on slow connections.
export const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta", display: "optional", preload: false });

// Not variable, so load only two weights: 500 renders as 400 and 600 as 700.
// "optional" means Arabic pages never shift after first paint.
export const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "700"],
  variable: "--font-plex-ar",
  display: "optional",
  preload: false,
});

export const fontVariables = `${inter.variable} ${jakarta.variable} ${plexArabic.variable}`;
