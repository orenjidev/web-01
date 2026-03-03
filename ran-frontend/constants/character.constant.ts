export const schoolOptions = [
  { label: "Sacred Gate", value: "sg" },
  { label: "Mystic Peak", value: "mp" },
  { label: "Phoenix", value: "pnx" },
];

export const schoolOptionsNumToText = [
  { label: "Sacred Gate", value: 0 },
  { label: "Mystic Peak", value: 1 },
  { label: "Phoenix", value: 2 },
];

export const classOptions = [
  { label: "Brawler", value: "brawler" },
  { label: "Swordsman", value: "swordsman" },
  { label: "Archer", value: "archer" },
  { label: "Shaman", value: "shaman" },
  { label: "Extreme", value: "extreme" },
  { label: "Gunner", value: "gunner" },
  { label: "Assassin", value: "assassin" },
  { label: "Magician", value: "magician" },
  { label: "Shaper", value: "shaper" },
] as const;

export type ClassValue = (typeof classOptions)[number]["value"];
