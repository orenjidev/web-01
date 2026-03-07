import fs from "fs";
import os from "os";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildSkillStrings } from "../../../scripts/build-skill-strings.js";

describe("buildSkillStrings()", () => {
  it("parses XML SN/SD entries", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-skill-strings-xml-"));
    const input = path.join(dir, "SkillStringTable.xml");
    const output = path.join(dir, "skills.strings.json");

    fs.writeFileSync(
      input,
      [
        "<TEXT>",
        '<SENTENSE Ver="1" Id="SN_000_001"><VALUE Lang="Common">Heavy Punch</VALUE></SENTENSE>',
        '<SENTENSE Ver="1" Id="SD_000_001"><VALUE Lang="Common">Maximum attack of fist.</VALUE></SENTENSE>',
        "</TEXT>",
      ].join(""),
      "utf8",
    );

    const result = await buildSkillStrings(input, output);
    const built = JSON.parse(fs.readFileSync(output, "utf8"));

    expect(result.skillCount).toBe(1);
    expect(built.SN_000_001).toMatchObject({
      name: "Heavy Punch",
      description: "Maximum attack of fist.",
    });
  });

  it("parses TXT SN/SD entries", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-skill-strings-txt-"));
    const input = path.join(dir, "SkillStringTable.txt");
    const output = path.join(dir, "skills.strings.json");

    fs.writeFileSync(
      input,
      [
        "// comment",
        "SN_000_002\tTokkan Punch",
        "SD_000_002\tContinuous multiple fist strike.",
      ].join("\n"),
      "utf8",
    );

    const result = await buildSkillStrings(input, output);
    const built = JSON.parse(fs.readFileSync(output, "utf8"));

    expect(result.skillCount).toBe(1);
    expect(built.SN_000_002).toMatchObject({
      name: "Tokkan Punch",
      description: "Continuous multiple fist strike.",
    });
  });
});
