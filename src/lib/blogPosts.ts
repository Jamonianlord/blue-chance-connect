export type BlogPost = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  date: string;
  coverImage: string;
  author: string;
  category: string;
};

export const blogPosts: BlogPost[] = [
  {
    title: "Why We Built 1Chance Around One Match at a Time",
    slug: "why-we-built-1chance-around-one-match-at-a-time",
    excerpt: "No feeds. No endless swiping. Just one conversation at a time \u2014 here\u2019s why we designed it that way.",
    body: `Most apps today treat meeting people like a shopping experience: scroll through options, compare profiles, make a quick decision, move on. The problem is that approach doesn\u2019t actually lead to better conversations \u2014 it leads to decision fatigue.

When you design for browsing, you encourage performance. People start curating their profiles, timing their messages, and treating each match like a transaction rather than a human being. The pressure to make the right choice from a lineup of strangers kills spontaneity.

1Chance was built around a different premise: the best conversations happen when you skip the performance entirely. By showing you one person at a time with no profile to judge beforehand, we remove the incentive to overthink or rehearse. You just show up, say hello, and see where it goes.

That single-match model also keeps the experience lightweight. There\u2019s no backlog of unmatched conversations, no guilt about ignoring someone, and no endless scroll that turns meeting people into a chore. You chat, you part ways if it\u2019s not clicking, and you can try again instantly \u2014 zero friction, zero pressure.

It\u2019s not about limiting choice for the sake of it. It\u2019s about removing the parts of online meeting that feel like work, so the only thing left is the conversation itself.`,
    date: "2026-08-03",
    coverImage: "/blog-covers/product-updates.svg",
    author: "1Chance Team",
    category: "Product Updates",
  },
  {
    title: "Staying Safe While Meeting Strangers Online",
    slug: "staying-safe-while-meeting-strangers-online",
    excerpt: "Anonymous chat can be freeing \u2014 here\u2019s how to keep it that way safely.",
    body: `Meeting new people online opens up genuine connection, but it comes with real responsibilities. The good news is that staying safe doesn\u2019t require paranoia \u2014 just a few simple habits.

Never share personal or financial information early. Your home address, bank details, and even your full name don\u2019t need to come up in the first conversation, no matter how comfortable things feel. Legitimate connections can wait until trust is built.

Use the tools the platform gives you. In-app block and report features exist for a reason. If someone is pushing boundaries, making you uncomfortable, or asking for things you\u2019re not ready to give, you don\u2019t owe them an explanation. Block and move on \u2014 your safety isn\u2019t negotiable.

Trust your instincts. If a conversation feels scripted, pressured, or just off, that feeling is worth listening to. Intuition is your brain noticing patterns before your conscious mind can name them. Acting on it early prevents bigger problems later.

Keep initial conversations on the platform. Moving to other apps or sharing phone numbers too quickly removes the safety net of in-app reporting and anonymity. Good platforms design protection into the experience \u2014 1Chance keeps you anonymous by default so you control exactly what you share and when.`,
    date: "2026-07-29",
    coverImage: "/blog-covers/safety-tips.svg",
    author: "Safety Team",
    category: "Safety Tips",
  },
  {
    title: "Why Talking to a Stranger Beats Swiping Through Profiles",
    slug: "why-talking-to-a-stranger-beats-swiping-through-profiles",
    excerpt: "Curated profiles create pressure. Random connection creates honesty.",
    body: `There\u2019s a reason so many people find dating apps exhausting. Swiping through curated profiles turns meeting people into an evaluation exercise \u2014 you\u2019re judging a bio and a photo before you\u2019ve even said hello. That process doesn\u2019t just filter for good matches; it filters for people who are good at presenting themselves, which is a very different thing.

The pressure of a profile creates performative behavior. People write bios they think will attract matches rather than bios that reflect who they actually are. First messages become rehearsed openers rather than genuine curiosity. The whole system rewards performance over personality.

Random chat flips that dynamic completely. When there\u2019s no profile to judge, no bio to craft, and no reputation to maintain, people tend to be more honest in their first messages. You\u2019re not performing for an audience \u2014 you\u2019re just talking to another person. That\u2019s where real connection starts.

1Chance\u2019s one-match-at-a-time model removes the performance entirely. You don\u2019t build a profile, you don\u2019t swipe, and you don\u2019t accumulate matches like collectibles. You just talk. The conversations that emerge from that approach tend to be more authentic from the very first message.`,
    date: "2026-07-22",
    coverImage: "/blog-covers/dating-connection.svg",
    author: "Community Team",
    category: "Dating & Connection",
  },
  {
    title: "The Conversations Happening on 1Chance Right Now",
    slug: "the-conversations-happening-on-1chance-right-now",
    excerpt: "From late-night chats to new friendships \u2014 a look at what\u2019s actually happening on the app.",
    body: `Every match on 1Chance starts with a single click and leads somewhere unpredictable. That\u2019s the design. What happens next is entirely up to the people on either end of the conversation.

Late-night conversations tend to dominate the early match window. People are more relaxed after hours, less guarded, and more willing to talk about things that don\u2019t fit into a quick bio. Music recommendations, travel stories, random observations about the day \u2014 the small stuff that becomes meaningful when you\u2019re actually paying attention.

Friendship conversations happen too. Not every match turns romantic, and that\u2019s by design. A lot of people use 1Chance just to talk \u2014 to practice a language, to vent about work, or to hear about someone else\u2019s life in a different city or country. Those connections are just as real as any other.

The range of conversations the random-match model enables is what makes it work. Without the expectation of dating hanging over every interaction, people relax into being themselves. And that\u2019s when the interesting stuff happens \u2014 late-night philosophy debates, sudden shared obsessions, or just two people laughing at the same weird thing for twenty minutes.

That\u2019s what 1Chance is built for: moments of real connection, however they show up.`,
    date: "2026-07-15",
    coverImage: "/blog-covers/community-stories.svg",
    author: "Community Team",
    category: "Community Stories",
  },
  {
    title: "Building 1Chance: What\u2019s Next on Our Roadmap",
    slug: "building-1chance-whats-next-on-our-roadmap",
    excerpt: "A look at what we\u2019re building next \u2014 friend requests, voice notes, and more.",
    body: `We shipped a lot over the past few months. Friend requests and direct chats let people move from a random match to a real ongoing connection. Voice notes added a new dimension to conversations \u2014 hearing someone\u2019s tone, their laugh, the pauses between thoughts, makes text chat feel a lot more human. Unread badges and notification improvements made it easier to keep up with conversations without feeling overwhelmed.

None of that happened by accident. Every feature we ship comes from watching how people actually use 1Chance. We look at where conversations stall, where people ask for things we haven\u2019t built yet, and where the experience feels frictionless in a good way. That feedback loop is the roadmap.

Right now we\u2019re exploring a few directions. Group chats for people who meet through mutual matches. Better onboarding that helps new users understand the one-match model before their first conversation. And deeper safety tools that make reporting and blocking even more seamless.

The goal isn\u2019t to add features for the sake of it. It\u2019s to make 1Chance feel more like a natural extension of how people already connect \u2014 low friction, high authenticity, and safety built in from the start rather than bolted on later.

We\u2019re a small team, but we ship fast because we listen closely. If there\u2019s something you\u2019d like to see, the best way to make it happen is to use the app, have conversations, and tell us what works and what doesn\u2019t.`,
    date: "2026-07-08",
    coverImage: "/blog-covers/behind-scenes.svg",
    author: "1Chance Team",
    category: "Behind the Scenes",
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

export function getPostsByCategory(category: string): BlogPost[] {
  if (category === "All") return getAllBlogPosts();
  return getAllBlogPosts().filter((post) => post.category === category);
}

export const categories = ["All", "Product Updates", "Safety Tips", "Dating & Connection", "Community Stories", "Behind the Scenes"];