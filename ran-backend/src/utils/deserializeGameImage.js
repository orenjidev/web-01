// utils/expSkillDeserializer.js

import { getSkillName } from "../loaders/skills.loader.js";

class ByteStream {
  constructor(buffer) {
    this.buffer = buffer;
    this.offset = 0;
  }

  readUInt32() {
    const val = this.buffer.readUInt32LE(this.offset);
    this.offset += 4;
    return val;
  }

  readUInt16() {
    const val = this.buffer.readUInt16LE(this.offset);
    this.offset += 2;
    return val;
  }

  skip(bytes) {
    this.offset += bytes;
  }
}

export function deserializeExpSkills(buffer) {
  const stream = new ByteStream(buffer);

  const version = stream.readUInt32();
  const structSize = stream.readUInt32();
  const count = stream.readUInt32();

  const skills = [];

  for (let i = 0; i < count; i++) {
    const dwID = stream.readUInt32();
    const level = stream.readUInt16();
    const mainId = dwID & 0xffff;
    const subId = (dwID >> 16) & 0xffff;

    if (structSize === 8) {
      stream.skip(2);
    }

    skills.push({
      //dwID,
      mainId,
      subId,
      level,
      skillname: getSkillName(mainId, subId),
    });
  }

  return {
    //version,
    //count,
    skills,
  };
}
