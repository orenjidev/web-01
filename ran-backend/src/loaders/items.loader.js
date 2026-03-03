import fs from "fs";
import path from "path";

const ITEMS_PATH = path.resolve("generated/items.web.json");

let cache = null;

export function loadItems() {
  if (!cache) {
    cache = JSON.parse(fs.readFileSync(ITEMS_PATH, "utf8"));
  }
  return cache;
}
