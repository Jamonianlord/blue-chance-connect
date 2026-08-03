import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { getAllBlogPosts, getPostsByCategory, categories, type BlogPost } from "@/lib/blogPosts";
import { format } from "date-fns";
import { useState, useEffect, useRef, useCallback } from "react";

export const Route = createFileRoute("/blog/")({
  component: BlogIndexPage,
  head: () => ({
    meta: [
      { title: "Blog \u2014 1Chance" },
      { name: "description", content: "Read about online conversation tips, safety tips, and the best apps to meet new people." },
      { property: "og:title", content: "Blog \u2014 1Chance" },
      { property: "og:description", content: "Tips for starting conversations, staying safe online, and finding the best apps to meet new people." },
      { property: "og:type", content: "website" },
    ],
  }),
});

const POSTS_PER_PAGE = 6;

function BlogIndexPage() {
  const allPosts = getAllBlogPosts();
  const [activeCategory, setActiveCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const pillRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const filteredPosts = getPostsByCategory(activeCategory);
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;
  const spotlight = allPosts[0];

  const updateIndicator = useCallback(() => {
    const activeEl = pillRefs.current.get(activeCategory);
    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
      });
    }
  }, [activeCategory]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  useEffect(() => {
    setVisibleCount(POSTS_PER_PAGE);
  }, [activeCategory]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    const timeout = setTimeout(() => {
      document.querySelectorAll(".blog-reveal:not(.is-revealed)").forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timeout);
      observer.disconnect();
    };
  }, [visiblePosts, activeCategory]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        {/* Spotlight Section */}
        <section className="relative overflow-hidden py-12 sm:py-20">
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="auth-gradient-layer absolute -inset-[20%]" style={{
              background: "radial-gradient(45% 45% at 25% 30%, color-mix(in oklab, var(--brand) 30%, transparent) 0%, transparent 70%), radial-gradient(40% 40% at 78% 68%, color-mix(in oklab, var(--brand) 22%, transparent) 0%, transparent 70%)",
            }} />
            <div className="auth-blob absolute -left-24 top-10 h-72 w-72 rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--brand) 22%, transparent)" }} />
            <div className="auth-blob absolute -right-20 bottom-0 h-80 w-80 rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--brand) 16%, transparent)", animationDelay: "-8s" }} />
          </div>
          <div className="relative z-10 mx-auto max-w-4xl px-4">
            <Link to={`/blog/$slug`} params={{ slug: spotlight.slug }} className="spotlight-card block blog-reveal">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <img src={spotlight.coverImage} alt={spotlight.title} className="w-full h-48 sm:h-40 sm:w-56 object-cover rounded-xl" />
                <div className="flex-1 min-w-0">
                  <span className="inline-block rounded-full bg-[var(--brand)]/10 px-3 py-1 text-xs font-medium text-[var(--brand)] mb-2">{spotlight.category}</span>
                  <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl mb-2">{spotlight.title}</h1>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{spotlight.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{format(new Date(spotlight.date), "MMMM d, yyyy")}</span>
                    <span>\u00B7</span>
                    <span>{spotlight.author}</span>
                  </div>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm text-[var(--brand)] font-medium">
                    Read more
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4m-6-8h10.586a1 1 0 010 1.414L14.414 21.414a1 1 0 01-1.414 0L3 12.414a1 1 0 010-1.414L11.586 2.586a1 1 0 011.414 0H18" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* Latest Posts Strip */}
        <section className="border-y border-border bg-muted/30 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-lg font-semibold mb-4">Latest Posts</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible">
              {allPosts.slice(1).map((post, i) => (
                <Link
                  key={post.slug}
                  to={`/blog/$slug`}
                  params={{ slug: post.slug }}
                  className="blog-reveal flex-shrink-0 w-72 sm:w-auto rounded-xl border border-border bg-card p-4 shadow-sm transition-colors hover:border-[var(--brand)]/50"
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <time className="block text-xs text-muted-foreground mb-1">{format(new Date(post.date), "MMM d, yyyy")}</time>
                  <h3 className="text-sm font-semibold leading-snug line-clamp-2">{post.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Category Filter */}
        <section className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="relative flex gap-2 overflow-x-auto" role="tablist">
              <div
                className="category-indicator"
                style={{ left: indicatorStyle.left, width: indicatorStyle.width }}
              />
              {categories.map((cat) => (
                <button
                  key={cat}
                  ref={(el) => { if (el) pillRefs.current.set(cat, el); }}
                  onClick={() => setActiveCategory(cat)}
                  className={`category-pill z-10 ${activeCategory === cat ? "category-pill-active" : "category-pill-inactive"}`}
                  role="tab"
                  aria-selected={activeCategory === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Posts Grid */}
        <section className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post, i) => (
              <Link
                key={post.slug}
                to={`/blog/$slug`}
                params={{ slug: post.slug }}
                className="blog-card blog-reveal flex flex-col"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <img src={post.coverImage} alt={post.title} className="w-full h-44 object-cover" />
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-xs text-[var(--brand)] font-medium mb-1">{post.category}</span>
                  <time className="block text-xs text-muted-foreground mb-1">{format(new Date(post.date), "MMMM d, yyyy")}</time>
                  <h3 className="text-lg font-semibold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium">{post.author}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                onClick={() => setVisibleCount((c) => c + POSTS_PER_PAGE)}
                className="btn-pop inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-[var(--brand-foreground)]"
              >
                Load more
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </section>

        {/* Bottom CTA Banner */}
        <section className="mx-auto max-w-7xl px-4 pb-16">
          <div className="blog-cta-section relative overflow-hidden rounded-3xl bg-[var(--brand-soft)]/40 px-6 py-12 sm:px-12 sm:py-16 text-center">
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="auth-blob absolute -left-20 top-0 h-64 w-64 rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--brand) 18%, transparent)" }} />
              <div className="auth-blob absolute -right-20 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: "color-mix(in oklab, var(--brand) 14%, transparent)", animationDelay: "-8s" }} />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl mb-3">Ready to meet someone new?</h2>
              <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">One click, one match, one chance. Start a real conversation right now.</p>
              <Link to="/auth" className="btn-pop inline-flex items-center justify-center rounded-full bg-[var(--brand)] px-8 py-3 text-base font-semibold text-[var(--brand-foreground)]">
                Get started
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}