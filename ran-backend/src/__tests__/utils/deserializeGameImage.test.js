import { describe, it, expect, vi } from "vitest";

vi.mock("../../loaders/skills.loader.js", () => ({
  getSkillName: vi.fn((mainId, subId) => `Skill-${mainId}-${subId}`),
}));

import { deserializeExpSkills } from "../../utils/deserializeGameImage.js";

function makeBufferV8(mainId, subId, level) {
  const buffer = Buffer.alloc(20);
  let offset = 0;

  buffer.writeUInt32LE(256, offset); offset += 4;
  buffer.writeUInt32LE(8, offset); offset += 4;
  buffer.writeUInt32LE(1, offset); offset += 4;

  const dwID = (subId << 16) | mainId;
  buffer.writeUInt32LE(dwID, offset); offset += 4;
  buffer.writeUInt16LE(level, offset); offset += 2;
  buffer.writeUInt16LE(0, offset);

  return buffer;
}

describe("deserializeExpSkills()", () => {
  it("maps mainId/subId and resolves skill name without ReferenceError", () => {
    const buffer = makeBufferV8(10, 18, 5);
    const result = deserializeExpSkills(buffer);

    expect(result.skills).toHaveLength(1);
    expect(result.skills[0]).toMatchObject({
      mainId: 10,
      subId: 18,
      level: 5,
      skillname: "Skill-10-18",
    });
  });
});
