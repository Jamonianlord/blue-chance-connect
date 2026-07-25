const fs = require("fs");
const path = "src/routes/match.tsx";
let content = fs.readFileSync(path, "utf8");
const before = content;

content = content.split("pollFor").join("pollRef");
content = content.split("cancelledFor").join("cancelledRef");

if (content === before) {
  console.log("NO CHANGES MADE");
} else {
  fs.writeFileSync(path, content, "utf8");
  console.log("Typos fixed successfully");
}
