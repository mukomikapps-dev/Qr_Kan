// Background Pattern Library
export type BgPattern = {
  id: string;
  name: string;
  description: string;
  dataUrl: string; // SVG as data URL
};

export const BG_PATTERNS: BgPattern[] = [
  {
    id: "dots",
    name: "Dots",
    description: "Pola titik-titik klasik",
    dataUrl: `data:image/svg+xml,%3Csvg width='20' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23000' opacity='0.1'/%3E%3C/svg%3E`,
  },
  {
    id: "grid",
    name: "Grid",
    description: "Kotak-kotak sederhana",
    dataUrl: `data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='%23000' stroke-width='1' opacity='0.05'/%3E%3C/svg%3E`,
  },
  {
    id: "diagonal",
    name: "Diagonal",
    description: "Garis diagonal miring",
    dataUrl: `data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 40L40 0' stroke='%23000' stroke-width='1' opacity='0.08'/%3E%3C/svg%3E`,
  },
  {
    id: "waves",
    name: "Waves",
    description: "Ombak yang menenangkan",
    dataUrl: `data:image/svg+xml,%3Csvg width='100' height='20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 10 Q25 0 50 10 T100 10' stroke='%23000' fill='none' stroke-width='1' opacity='0.1'/%3E%3C/svg%3E`,
  },
  {
    id: "hexagon",
    name: "Hexagon",
    description: "Pola sarang lebah",
    dataUrl: `data:image/svg+xml,%3Csvg width='56' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 66L0 50L0 16L28 0L56 16L56 50z' fill='none' stroke='%23000' stroke-width='1' opacity='0.06'/%3E%3C/svg%3E`,
  },
  {
    id: "circles",
    name: "Circles",
    description: "Lingkaran-lingkaran overlapping",
    dataUrl: `data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='30' cy='30' r='20' fill='none' stroke='%23000' stroke-width='1' opacity='0.08'/%3E%3C/svg%3E`,
  },
];

export function getBgPattern(id: string): BgPattern | undefined {
  return BG_PATTERNS.find((p) => p.id === id);
}

