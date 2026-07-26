const fs = require("fs");
const path = "src/routes/chat.$chatId.tsx";
let content = fs.readFileSync(path, "utf8");
const before = content;

content = content.replace(
  `    } else if (data) {
      setMessages((cur) => cur.map((m) => (m.id === tempId ? (data as Message) : m)));
    }

    setSending(false);`,
  `    } else if (data) {
      setMessages((cur) => cur.map((m) => (m.id === tempId ? (data as Message) : m)));
      supabase.from("analytics_events").insert({ user_id: user.id, event_type: "message_sent" }).then(() => {}, (err) => console.warn("[analytics] message_sent failed", err));
    }

    setSending(false);`
);

if (content === before) { console.log("NO CHANGES MADE to chat.\$chatId.tsx"); }
else { fs.writeFileSync(path, content, "utf8"); console.log("chat.\$chatId.tsx updated"); }
