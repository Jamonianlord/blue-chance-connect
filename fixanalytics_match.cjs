const fs = require("fs");
const path = "src/routes/match.tsx";
let content = fs.readFileSync(path, "utf8");
const before = content;

content = content.replace(
  `    setSearching(true);
    cancelledRef.current = false;`,
  `    setSearching(true);
    cancelledRef.current = false;
    supabase.from("analytics_events").insert({ user_id: user.id, event_type: "match_started" }).then(() => {}, (err) => console.warn("[analytics] match_started failed", err));`
);

content = content.replace(
  `      if (pollRef.current) clearInterval(pollRef.current);
      navigate({ to: "/chat/$chatId", params: { chatId } });`,
  `      if (pollRef.current) clearInterval(pollRef.current);
      supabase.from("analytics_events").insert({ user_id: user.id, event_type: "match_completed" }).then(() => {}, (err) => console.warn("[analytics] match_completed failed", err));
      navigate({ to: "/chat/$chatId", params: { chatId } });`
);

if (content === before) {
  console.log("NO CHANGES MADE to match.tsx");
} else {
  fs.writeFileSync(path, content, "utf8");
  console.log("match.tsx updated successfully");
}
