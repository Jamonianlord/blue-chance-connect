export type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  date: string; // ISO date string
};

export const blogPosts: BlogPost[] = [
  {
    title: "How to Start a Conversation With a Stranger Online",
    slug: "how-to-start-a-conversation-with-a-stranger-online",
    excerpt: "Skip the generic 'hey' and open with something specific — a reaction to their profile, a genuine question, or just naming the moment. The best openers are honest, not rehearsed.",
    body: "Starting a conversation with someone you've never met can feel awkward — but it doesn't have to be. Skip the generic 'hey' and instead open with something specific: a reaction to their profile detail, a genuine question, or even just naming the moment ('so, random chat app, huh?'). The best openers are honest, not rehearsed — people can tell the difference between a real question and a copy-pasted line. Keep early messages short and let the conversation breathe; you don't need to fill every silence. If it's not clicking, that's fine too — not every match needs to become a conversation, and that's exactly why platforms like 1Chance let you start fresh with one click. The goal isn't a perfect opener, it's just showing up as yourself.",
    date: "2026-07-15",
  },
  {
    title: "Is It Safe to Chat With Strangers Online? What to Know",
    slug: "is-it-safe-to-chat-with-strangers-online",
    excerpt: "Meeting new people online is normal now — but it's worth being intentional about staying safe. A few simple habits go a long way: never share financial details, trust your gut, and use platforms with built-in safety.",
    body: "Meeting new people online is normal now — but it's worth being intentional about staying safe while doing it. A few simple habits go a long way: never share financial details, passwords, or your home address with someone you've just matched with, no matter how the conversation is going. Trust your gut — if something feels off, you don't owe anyone an explanation before you block or leave. Good platforms build safety in by default: staying anonymous until you choose to share more, one-tap reporting and blocking, and no permanent public trace of your conversations. That's the design philosophy behind 1Chance — anonymous by default, in your control always, and safety features that are visible, not buried in a settings menu somewhere.",
    date: "2026-07-22",
  },
  {
    title: "Best Free Apps to Meet New People in 2026",
    slug: "best-free-apps-to-meet-new-people",
    excerpt: "Not every app for meeting people has to be a dating app. Look for platforms that get you talking quickly, let you stay anonymous until comfortable, and have safety built in from the start.",
    body: "Not every app for meeting people has to be a dating app. Some of the best options today focus purely on connection and conversation, no swiping or profile-building required. Look for platforms that get you talking quickly rather than making you invest in a curated profile first — the lower the friction, the more genuine the early conversation tends to be. Also worth checking: does the app let you stay anonymous until you're comfortable sharing more? Are reporting and blocking easy to find, not buried three menus deep? 1Chance was built around exactly this — one click, instant match, real conversation, with safety built in from the start rather than added as an afterthought.",
    date: "2026-07-29",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}