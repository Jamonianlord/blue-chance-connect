const fs = require("fs");
const path = "src/routes/auth.tsx";
let content = fs.readFileSync(path, "utf8");
const before = content;

content = content.replace(
  `        await refreshProfile();
        toast.success("Welcome to 1Chance!");
        navigate({ to: "/match" });`,
  `        await refreshProfile();
        supabase.from("analytics_events").insert({ user_id: uid, event_type: "signup_completed" }).then(() => {}, (err) => console.warn("[analytics] signup_completed failed", err));
        toast.success("Welcome to 1Chance!");
        navigate({ to: "/match" });`
);

if (content === before) { console.log("NO CHANGES MADE to auth.tsx"); }
else { fs.writeFileSync(path, content, "utf8"); console.log("auth.tsx updated"); }
