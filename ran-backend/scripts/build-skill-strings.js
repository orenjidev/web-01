import fs from "fs";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { fileURLToPath } from "url";

const INPUT_XML = path.resolve("data/skills/SkillStringTable.xml");
const INPUT_TXT = path.resolve("data/skills/SkillStringTable.txt");
const OUTPUT = path.resolve("generated/skills.strings.json");

function ensureSkillEntry(map, skillId) {
  if (!map[skillId]) map[skillId] = {};
  return map[skillId];
}

function toSkillId(id) {
  if (!id) return null;
  if (id.startsWith("SN_")) return id;
  if (id.startsWith("SD_")) return `SN_${id.slice(3)}`;
  return null;
}

function parseXmlContent(xmlData) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    trimValues: true,
  });

  let parsed = parser.parse(xmlData);
  if (!parsed?.TEXT?.SENTENSE && !parsed?.SENTENSE) {
    // Supports fragment files that contain only repeated SENTENSE blocks.
    parsed = parser.parse(`<TEXT>${xmlData}</TEXT>`);
  }

  const sentenses = parsed?.TEXT?.SENTENSE ?? parsed?.SENTENSE;
  if (!sentenses) {
    throw new Error("Invalid skill strings XML format.");
  }

  const list = Array.isArray(sentenses) ? sentenses : [sentenses];
  const map = {};

  for (const node of list) {
    const id = String(node?.Id || "").trim();
    const skillId = toSkillId(id);
    if (!skillId) continue;

    const valueNode = node?.VALUE;
    let text = "";
    if (Array.isArray(valueNode)) {
      const common = valueNode.find((v) => v?.Lang === "Common") ?? valueNode[0];
      text = String(common?.["#text"] ?? "").trim();
    } else if (valueNode && typeof valueNode === "object") {
      text = String(valueNode["#text"] ?? "").trim();
    } else {
      text = String(valueNode ?? "").trim();
    }

    if (!text) continue;

    const entry = ensureSkillEntry(map, skillId);
    if (id.startsWith("SN_")) entry.name = text;
    if (id.startsWith("SD_")) entry.description = text;
  }

  return map;
}

function parseTxtContent(txtData) {
  const map = {};
  const lines = txtData.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("//")) continue;

    const parts = line.split("\t");
    if (parts.length < 2) continue;

    const id = String(parts[0] || "").trim();
    const text = parts.slice(1).join("\t").trim();
    if (!id || !text) continue;

    const skillId = toSkillId(id);
    if (!skillId) continue;

    const entry = ensureSkillEntry(map, skillId);
    if (id.startsWith("SN_")) entry.name = text;
    if (id.startsWith("SD_")) entry.description = text;
  }

  return map;
}

export async function buildSkillStrings(inputPath, outputPath = OUTPUT) {
  if (!inputPath) {
    if (fs.existsSync(INPUT_XML)) inputPath = INPUT_XML;
    else if (fs.existsSync(INPUT_TXT)) inputPath = INPUT_TXT;
    else throw new Error("No skill strings source file found.");
  }

  const ext = path.extname(inputPath).toLowerCase();
  const raw = fs.readFileSync(inputPath, "utf8");

  let map = {};
  if (ext === ".xml") map = parseXmlContent(raw);
  else if (ext === ".txt") map = parseTxtContent(raw);
  else throw new Error("Skill strings file must be .xml or .txt");

  const normalized = {};
  for (const [skillId, value] of Object.entries(map)) {
    if (!value?.name && !value?.description) continue;
    normalized[skillId] = {
      name: value.name ?? null,
      description: value.description ?? null,
    };
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(normalized, null, 2));

  return { skillCount: Object.keys(normalized).length };
}

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  buildSkillStrings()
    .then(({ skillCount }) => console.log(`Built ${skillCount} skill strings`))
    .catch((err) => {
      console.error(err.message);
      process.exit(1);
    });
}
