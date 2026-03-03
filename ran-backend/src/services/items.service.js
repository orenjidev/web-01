import fs from "fs";
import path from "path";

const DATA_PATH = path.resolve("generated/items.web.json");

// Internal cache
let itemsArray = null;
let itemsById = null;
let loadedAt = null;

// Optional version tag (change per maintenance)
export const ITEMS_CACHE_VERSION = "maintenance-2026-02-04";

/**
 * Load item cache into memory.
 * Intended to be called once at startup or manually on refresh.
 */
export function initItemsCache(force = false) {
  if (itemsArray && itemsById && !force) return;

  const start = process.hrtime.bigint();

  const raw = fs.readFileSync(DATA_PATH, "utf8");
  const parsed = JSON.parse(raw);

  itemsArray = parsed;
  itemsById = new Map(parsed.map((item) => [item.itemId, item]));
  loadedAt = new Date();

  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1_000_000;

  console.log(
    `[items] cache loaded (${itemsArray.length} items) in ${ms.toFixed(2)} ms`,
  );
}

/**
 * Returns all items (read-only).
 */
export function getItems() {
  if (!itemsArray) initItemsCache();
  return itemsArray;
}

/**
 * Returns a single item by itemId (e.g. "2-5").
 */
export function getItemById(itemId) {
  if (!itemsById) initItemsCache();
  return itemsById.get(itemId) || null;
}

/**
 * Optional helper for admin/debug visibility
 */
export function getItemsCacheInfo() {
  return {
    loaded: !!itemsArray,
    count: itemsArray?.length ?? 0,
    loadedAt,
    version: ITEMS_CACHE_VERSION,
  };
}
