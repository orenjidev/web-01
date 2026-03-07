import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect } from "vitest";
import { buildSkills } from "../../../scripts/build-skills.js";

describe("buildSkills()", () => {
  it("builds skills JSON from CSV with game headers and addon labels", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-skills-ok-"));
    const csvPath = path.join(dir, "Skill.csv");
    const outputPath = path.join(dir, "skills.web.json");

    fs.writeFileSync(
      csvPath,
      [
        "sNATIVEID wMainID,sNATIVEID wSubID,szNAME,dwGRADE,dwMAXLEVEL,emIMPACT_TAR,emIMPACT_REALM,emIMPACT_SIDE,emADDON1,fADDON_VAR1_1,fRate1_1,fADDON_VAR1_2,fRate1_2,emSPEC1,sSPEC1_1 fVAR1,sSPEC1_1 fVAR2,sSPEC1_1 fRate,sSPEC1_1 fRate2,sSPEC1_1 dwFLAG,sSPEC1_1 Native MID,sSPEC1_1 Native SID,sSPEC1_1 Link MID,sSPEC1_1 Link SID,sSPEC1_2 fVAR1",
        "1,1,Power Strike,2,10,1,0,2,5,12.5,0.75,22,0.8,14,100,5,0.5,0.2,1,3,4,7,8,200",
        "2,3,Ice Lance,4,1,0,1,1,9,20,0.5,999,0.1,1,9,10,0.4,0.1,0,0,0,0,0,300",
      ].join("\n"),
      "utf8",
    );

    const result = await buildSkills(csvPath, outputPath, undefined, null);
    const built = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    expect(result.skillCount).toBe(2);
    expect(built[0]).toMatchObject({
      skillId: "SN_001_001",
      mainId: 1,
      subId: 1,
      name: "Power Strike",
      grade: 2,
      maxLevel: 10,
      classInfo: { group: "Brawler", glccValue: 65, glccHex: "0x00000041" },
      impact: { target: { id: 1, label: "Target" } },
    });
    expect(built[0].addons[0]).toMatchObject({
      id: 5,
      label: "HP Recover",
      scale: 100,
    });
    expect(typeof built[0].addons[0].description).toBe("string");
    expect(built[0].specAddons[0]).toMatchObject({
      id: 14,
      label: "Movement Speed",
      var1Label: "Movement Speed",
      var2Label: "None",
      var1Scale: 100,
      var2Scale: 1,
    });
    expect(typeof built[0].specAddons[0].description).toBe("string");
    expect(built[1]).toMatchObject({
      skillId: "SN_002_003",
      mainId: 2,
      subId: 3,
      name: "Ice Lance",
      grade: 4,
      maxLevel: 1,
    });
    expect(built[1].addons[0].levels).toHaveLength(1);
    expect(built[1].addons[0].levels[0]).toMatchObject({ level: 1, value: 20, rate: 0.5 });
    expect(built[1].specAddons[0].levels).toHaveLength(1);
  });

  it("resolves emspec addon id 99 with correct labels", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-skills-spec99-"));
    const csvPath = path.join(dir, "Skill.csv");
    const outputPath = path.join(dir, "skills.web.json");

    fs.writeFileSync(
      csvPath,
      [
        "sNATIVEID wMainID,sNATIVEID wSubID,szNAME,dwMAXLEVEL,emSPEC1,sSPEC1_1 fVAR1,sSPEC1_1 fVAR2",
        "1,1,Spec99 Test,1,99,1,2",
      ].join("\n"),
      "utf8",
    );

    await buildSkills(csvPath, outputPath, undefined, null);
    const built = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    expect(built[0].specAddons[0]).toMatchObject({
      id: 99,
      label: "Delay Action",
      var1Label: "Skill MID",
      var2Label: "Skill SID",
      var1Scale: 0,
      var2Scale: 0,
    });
  });

  it("throws deterministic error when required columns are missing", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-skills-missing-"));
    const csvPath = path.join(dir, "Skill.csv");
    const outputPath = path.join(dir, "skills.web.json");

    fs.writeFileSync(
      csvPath,
      [
        "sNATIVEID wSubID,szNAME",
        "1,Power Strike",
      ].join("\n"),
      "utf8",
    );

    await expect(buildSkills(csvPath, outputPath, undefined, null)).rejects.toThrow(
      /Missing required columns: mainId/i,
    );
  });

  it("overrides CSV name/description using built skill strings", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "build-skills-strings-"));
    const csvPath = path.join(dir, "Skill.csv");
    const outputPath = path.join(dir, "skills.web.json");
    const stringsPath = path.join(dir, "skills.strings.json");

    fs.writeFileSync(
      csvPath,
      [
        "sNATIVEID wMainID,sNATIVEID wSubID,szNAME,dwMAXLEVEL",
        "1,2,CSV Name,3",
      ].join("\n"),
      "utf8",
    );

    fs.writeFileSync(
      stringsPath,
      JSON.stringify({
        SN_001_002: {
          name: "Mapped Name",
          description: "Mapped Description",
        },
      }),
      "utf8",
    );

    await buildSkills(csvPath, outputPath, undefined, stringsPath);
    const built = JSON.parse(fs.readFileSync(outputPath, "utf8"));

    expect(built[0]).toMatchObject({
      skillId: "SN_001_002",
      name: "Mapped Name",
      description: "Mapped Description",
    });
  });
});
