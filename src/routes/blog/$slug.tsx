import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { getBlogPost } from "@/lib/blogPosts";
import { format } from "date-fns";
import { marked } from "marked";

export const Route = createFileRoute("/blog/$slug")({
  component: BlogPostPage,
  head: ({ params }) => {
    const post = getBlogPost(params.slug);
    const baseUrl = "https://1chance.fun";
    return {
      meta: [
        { title: post ? `${post.title} — 1Chance Blog` : "Blog Post — 1Chance" },
        { name: "description", content: post ? post.excerpt : "Blog post on 1Chance" },
        { property: "og:title", content: post ? post.title : "Blog Post — 1Chance" },
        { property: "og:description", content: post ? post.excerpt : "Blog post on 1Chance" },
        { property: "og:type", content: "article" },
        { property: "og:image", content: post ? `${baseUrl}${post.coverImage}` : `${baseUrl}/og-image.png` },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: post ? `${baseUrl}${post.coverImage}` : `${baseUrl}/og-image.png` },
      ],
    };
  },
});

function BlogPostPage() {
  const { slug } = Route.useParams();
  const post = getBlogPost(slug);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl font-bold">Post not found</h1>
          <p className="mt-3 text-muted-foreground">The blog post you're looking for doesn't exist.</p>
          <Link to="/blog" className="mt-4 inline-flex items-center gap-1 text-sm text-[var(--brand)] font-medium">
            Back to blog
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4m-6-8h10.586a1 1 0 010 1.414L14.414 21.414a1 1 0 01-1.414 0L3 12.414a1 1 0 010-1.414L11.586 2.586a1 1 0 011.414 0H18" />
            </svg>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-12">
        <article className="prose prose-invert dark:prose-invert max-w-none">
          <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-[var(--brand)] font-medium mb-6">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4m-6-8h10.586a1 1 0 010 1.414L14.414 21.414a1 1 0 01-1.414 0L3 12.414a1 1 0 010-1.414L11.586 2.586a1 1 0 011.414 0H18" />
            </svg>
            Back to blog
          </Link>
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full h-64 object-cover rounded-2xl mb-8"
          />
          <time className="block text-xs text-muted-foreground mb-2" dateTime={post.date}>
            {format(new Date(post.date), "MMMM d, yyyy")}
          </time>
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-6">{post.title}</h1>
          <div
            dangerouslySetInnerHTML={{ __html: marked.parse(post.body) }}
          />
        </article>
      </main>
    </div>
  );
}