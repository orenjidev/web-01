import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";

/* ======================================================
   CONFIG
====================================================== */

const INPUT = path.resolve("generated/skillstrtable.xml");

/* ======================================================
   CACHE
====================================================== */

let skillMap = null;

/* ======================================================
   LOAD XML ONCE
====================================================== */

function loadSkillMap() {
  if (skillMap) return skillMap;

  const xmlData = fs.readFileSync(INPUT, "utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });

  const parsed = parser.parse(xmlData);

  // ✔ Correct root based on your XML
  const sentenses = parsed?.TEXT?.SENTENSE;

  if (!sentenses) {
    throw new Error("Invalid SkillInfo.xml structure");
  }

  const list = Array.isArray(sentenses) ? sentenses : [sentenses];

  skillMap = {};

  for (const s of list) {
    const id = s.Id;
    if (!id) continue;

    const valueNode = s.VALUE;

    let name = "";

    if (Array.isArray(valueNode)) {
      const common = valueNode.find((v) => v.Lang === "Common");
      name = common?.["#text"] || "";
    } else {
      name = valueNode?.["#text"] || valueNode || "";
    }

    skillMap[id] = name;
  }

  return skillMap;
}

/* ======================================================
   ID CONVERSION
   10,18 → SN_010_018
====================================================== */

function toSkillId(main, sub) {
  const paddedMain = String(Number(main)).padStart(3, "0");
  const paddedSub = String(Number(sub)).padStart(3, "0");
  return `SN_${paddedMain}_${paddedSub}`;
}

/* ======================================================
   PUBLIC API
====================================================== */

export function getSkillName(main, sub) {
  const map = loadSkillMap();
  const skillId = toSkillId(main, sub);
  return map[skillId] || null;
}
