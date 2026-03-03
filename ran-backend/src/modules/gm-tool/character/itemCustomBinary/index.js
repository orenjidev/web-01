import * as v1000 from "./v1000.js";

const registry = {
  [v1000.VERSION]: v1000,
};

export function decodeSITEMCUSTOM(buffer, version = v1000.VERSION) {
  const handler = registry[version];
  if (!handler) throw new Error(`Unsupported SITEMCUSTOM version: ${version}`);
  return handler.decode(buffer);
}

export function encodeSITEMCUSTOM(obj, version = v1000.VERSION) {
  const handler = registry[version];
  if (!handler) throw new Error(`Unsupported SITEMCUSTOM version: ${version}`);
  return handler.encode(obj);
}

export function registerSITEMCUSTOM(version, handler) {
  registry[version] = handler;
}
