import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { getAllBlogPosts } from "@/lib/blogPosts";
import { format } from "date-fns";

export const Route = createFileRoute("/blog/")({
  component: BlogIndexPage,
  head: () => ({
    meta: [
      { title: "Blog — 1Chance" },
      { name: "description", content: "Read about online conversation tips, safety tips, and the best apps to meet new people." },
      { property: "og:title", content: "Blog — 1Chance" },
      { property: "og:description", content: "Tips for starting conversations, staying safe online, and finding the best apps to meet new people." },
      { property: "og:type", content: "website" },
    ],
  }),
});

function BlogIndexPage() {
  const posts = getAllBlogPosts();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <section className="text-center mb-12">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Blog</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Tips for starting conversations, staying safe online, and finding the best apps to meet new people.
          </p>
        </section>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to="/blog/$slug"
              params={{ slug: post.slug }}
              className="card-hover-glow rounded-2xl border border-border bg-card shadow-sm flex flex-col h-full overflow-hidden"
            >
              <img
                src={post.coverImage}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6 flex flex-col flex-1">
                <time className="text-xs text-muted-foreground mb-2" dateTime={post.date}>
                  {format(new Date(post.date), "MMMM d, yyyy")}
                </time>
                <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
                <p className="text-sm text-muted-foreground flex-1">{post.excerpt}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--brand)] font-medium">
                  Read more
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4m-6-8h10.586a1 1 0 010 1.414L14.414 21.414a1 1 0 01-1.414 0L3 12.414a1 1 0 010-1.414L11.586 2.586a1 1 0 011.414 0H18" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}