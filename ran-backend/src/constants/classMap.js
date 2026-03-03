// services/constants/classMap.js
export const classMap = {
  brawler: [1, 64],
  swordsman: [2, 128],
  archer: [256, 4], // female, male (reversed)
  shaman: [512, 8], // female, male (reversed)
  extreme: [16, 32],
  gunner: [1024, 2048],
  assassin: [4096, 8192],
  magician: [16384, 32768],
  shaper: [262144, 524288],
};

export function resolveGenderFlexible(classCode) {
  // Rule:
  // - Explicit female match → female
  // - Otherwise → male (fallback)

  for (const [className, [male, female]] of Object.entries(classMap)) {
    const reversed = className === "archer" || className === "shaman";

    if (!reversed) {
      // normal classes
      if (classCode === female) return "female";
    } else {
      // archer / shaman reversed
      if (classCode === male) return "female";
    }
  }

  // 🔒 fallback for legacy / unknown classes
  return "male";
}

export function resolveClassNameFromCode(classCode) {
  for (const [className, [male, female]] of Object.entries(classMap)) {
    if (classCode === male || classCode === female) {
      return className;
    }
  }

  // legacy / unknown classes have no logical name
  return null;
}
