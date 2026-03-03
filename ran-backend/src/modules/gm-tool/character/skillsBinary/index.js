import * as v256 from "./v256.js";

const registry = {
  [v256.VERSION]: v256,
};

export function deserialize(buffer) {
  const version = buffer.readUInt32LE(0);
  const handler = registry[version];

  if (!handler) {
    throw new Error(`Unsupported skill version: ${version}`);
  }

  return handler.deserialize(buffer);
}

export function serialize(version, skills) {
  const handler = registry[version];

  if (!handler) {
    throw new Error(`Unsupported skill version: ${version}`);
  }

  return handler.serialize(skills);
}
