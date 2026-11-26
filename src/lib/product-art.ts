/**
 * Generates local SVG product illustrations from lucide icons, so the demo has
 * consistent imagery without depending on any external image host.
 */
import { icons } from "lucide";

type Node = [string, Record<string, string | number>, Node[]?];
const esc = (v: string | number) => String(v).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const render = ([tag, attrs, children]: Node): string =>
  `<${tag}${Object.entries(attrs).map(([k, v]) => ` ${k}="${esc(v)}"`).join("")}>${(children ?? []).map(render).join("")}</${tag}>`;

export const ICON_NAMES = Object.keys(icons);
export const hasIcon = (name: string) => Object.prototype.hasOwnProperty.call(icons, name);

function iconInner(name: string): string {
  const svg = ((icons as unknown as Record<string, Node>)[name] ?? (icons as unknown as Record<string, Node>).Package) as Node;
  return (svg[2] ?? []).map(render).join("");
}

/** variant 0: hero colour, 1: light studio, 2: dark detail shot */
export function productSvg(iconName: string, [c1, c2]: [string, string], variant: 0 | 1 | 2): string {
  const inner = iconInner(iconName);
  const id = `g${variant}`;

  if (variant === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="800" height="800" fill="url(#${id})"/><circle cx="640" cy="150" r="220" fill="#fff" opacity=".08"/><circle cx="140" cy="700" r="260" fill="#000" opacity=".07"/><ellipse cx="400" cy="640" rx="210" ry="28" fill="#000" opacity=".18"/><g transform="translate(184 160) scale(18)" fill="none" stroke="#fff" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
  }
  if (variant === 1) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><defs><radialGradient id="${id}" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#EEF0EA"/></radialGradient><pattern id="d${variant}" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1.6" fill="${c1}" opacity=".12"/></pattern></defs><rect width="800" height="800" fill="url(#${id})"/><rect width="800" height="800" fill="url(#d${variant})"/><ellipse cx="400" cy="650" rx="230" ry="26" fill="${c1}" opacity=".14"/><g transform="translate(208 190) scale(16)" fill="none" stroke="${c1}" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round">${inner}</g></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800"><rect width="800" height="800" fill="#0F1C1B"/><circle cx="400" cy="400" r="300" fill="none" stroke="${c2}" stroke-width="2" opacity=".35"/><circle cx="400" cy="400" r="230" fill="${c1}" opacity=".35"/><g transform="translate(76 76) scale(27)" fill="none" stroke="${c2}" stroke-width=".8" stroke-linecap="round" stroke-linejoin="round" opacity=".95">${inner}</g></svg>`;
}

export function categorySvg(iconName: string, [c1, c2]: [string, string]): string {
  const inner = iconInner(iconName);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 400"><defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="400" fill="url(#c)"/><path d="M0 300c90-60 170-80 250-40s150 40 220-10c50-35 90-40 130-30v180H0z" fill="#fff" opacity=".12"/><g transform="translate(372 64) scale(8.5)" fill="none" stroke="#fff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" opacity=".9">${inner}</g></svg>`;
}
