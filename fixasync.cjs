const fs = require("fs");
const path = "src/routes/match.tsx";
let content = fs.readFileSync(path, "utf8");
const before = content;

content = content.replace(
  `const handleVisibility = () => {`,
  `const handleVisibility = async () => {`
);

content = content.replace(
  `const { data: existingChats } = supabase\n        .from("chats")`,
  `const { data: existingChats } = await supabase\n        .from("chats")`
);

if (content === before) {
  console.log("NO CHANGES MADE");
} else {
  fs.writeFileSync(path, content, "utf8");
  console.log("Async/await fix applied");
}
