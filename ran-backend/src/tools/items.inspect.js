import items from "../generated/items.web.json";

const boxes = items.filter((i) => i.box);

console.log(`Boxes: ${boxes.length}`);
console.log(boxes[0]);
