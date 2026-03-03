import { getSkillName } from "../../../../loaders/skills.loader.js";

export const VERSION = 256;
export const STRUCT_SIZE = 8;

export function deserialize(buffer) {
  let offset = 0;

  const version = buffer.readUInt32LE(offset);
  offset += 4;
  const structSize = buffer.readUInt32LE(offset);
  offset += 4;
  const count = buffer.readUInt32LE(offset);
  offset += 4;

  if (structSize !== STRUCT_SIZE) {
    throw new Error("Struct size mismatch for v256");
  }

  if (buffer.length !== 12 + count * STRUCT_SIZE) {
    throw new Error("Invalid buffer length");
  }

  const skills = [];

  for (let i = 0; i < count; i++) {
    const dwID = buffer.readUInt32LE(offset);
    offset += 4;
    const level = buffer.readUInt16LE(offset);
    offset += 2;
    offset += 2;

    // ✅ FIX: define variables before using them
    const mainId = dwID & 0xffff;
    const subId = (dwID >> 16) & 0xffff;

    let skillName = null;

    try {
      skillName = getSkillName(mainId, subId);
    } catch (err) {
      console.error("Skill lookup failed:", mainId, subId, err.message);
      skillName = "Unknown Skill";
    }

    skills.push({
      mainId,
      subId,
      level,
      skillName,
    });
  }

  return { version, skills };
}

export function serialize(skills) {
  const count = skills.length;
  const totalSize = 12 + count * STRUCT_SIZE;

  const buffer = Buffer.alloc(totalSize);
  let offset = 0;

  buffer.writeUInt32LE(VERSION, offset);
  offset += 4;
  buffer.writeUInt32LE(STRUCT_SIZE, offset);
  offset += 4;
  buffer.writeUInt32LE(count, offset);
  offset += 4;

  for (const skill of skills) {
    const dwID = skill.dwID ?? (skill.subId << 16) | skill.mainId;

    buffer.writeUInt32LE(dwID, offset);
    offset += 4;
    buffer.writeUInt16LE(skill.level, offset);
    offset += 2;
    buffer.writeUInt16LE(0, offset);
    offset += 2;
  }

  return buffer;
}
