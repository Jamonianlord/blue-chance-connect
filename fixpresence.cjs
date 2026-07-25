const fs = require("fs");
const path = "src/routes/match.tsx";
let content = fs.readFileSync(path, "utf8");
const before = content;

const oldPattern = /presenceChannel\?\.getState\(\(state\) => \{\s*const count = state \? Object\.keys\(state\)\.length : 0;\s*setSearchingCount\(count\);\s*\}\);/g;

const newCode = `const state = presenceChannel?.presenceState();
            const count = state ? Object.keys(state).length : 0;
            setSearchingCount(count);`;

content = content.replace(oldPattern, newCode);

if (content === before) {
  console.log("NO CHANGES MADE");
} else {
  const occurrences = (before.match(oldPattern) || []).length;
  fs.writeFileSync(path, content, "utf8");
  console.log("Fixed " + occurrences + " occurrence(s)");
}
