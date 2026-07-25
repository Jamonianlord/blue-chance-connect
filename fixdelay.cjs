const fs = require("fs");

const files = ["src/routes/match.tsx", "src/routes/chat.$chatId.tsx"];

for (const path of files) {
  let content = fs.readFileSync(path, "utf8");
  const before = content;

  content = content.split(
    "const delay = Math.min(1000 * reconnectAttempts, 10000);"
  ).join(
    "const delay = Math.min(200 * Math.pow(2, reconnectAttempts - 1), 8000);"
  );

  if (content === before) {
    console.log(path + ": NO CHANGE MADE");
  } else {
    fs.writeFileSync(path, content, "utf8");
    console.log(path + ": delay updated");
  }
}
