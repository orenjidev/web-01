import { getItems, getItemById } from "../src/services/items.service.js";

console.log("=== ITEM SERVICE TEST ===");

const items = getItems();
console.log("Total items:", items.length);

const first = items[0];
console.log("First item ID:", first.itemId);
console.log("First item name:", first.name);

const fetched = getItemById(first.itemId);
console.log("Fetched by ID:", fetched.name);

const boxes = items.filter((i) => i.box);
console.log("Boxes found:", boxes.length);

if (boxes.length) {
  console.log("First box contents:", boxes[0].box);
}

console.log("=== TEST COMPLETE ===");
