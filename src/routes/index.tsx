import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { createFileRoute, Link } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: LandingPage,
})

function LandingPage() {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_35%),radial-gradient(circle_at_80%_10%,color-mix(in_oklch,var(--primary)_9%,transparent),transparent_38%)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-5 py-8 md:px-8 md:py-10">
        <header className="flex items-center justify-between">
          <h1 className="font-heading text-2xl font-bold tracking-tight">Kimmit</h1>
          <div className="flex items-center gap-3">
            <ModeToggle />
            <Link to="/auth/login">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </header>

        <section className="space-y-6">
          <p className="inline-flex rounded-full border border-primary/35 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Developer activity to structured data engine
          </p>
          <h2 className="max-w-4xl font-heading text-4xl font-semibold leading-tight md:text-6xl">
            Convert raw GitHub commits into structured metadata, social content, and developer logs.
          </h2>
          <p className="max-w-3xl text-base text-muted-foreground md:text-lg">
            Kimmit transforms low-level engineering activity into human-readable summaries, SEO-friendly metadata, and ready-to-publish updates.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/auth/login">
              <Button size="lg">Sign in with GitHub or Google</Button>
            </Link>
            <a href="#pipeline">
              <Button size="lg" variant="outline">View Pipeline</Button>
            </a>
          </div>
        </section>

        <section id="pipeline" className="space-y-4">
          <h3 className="font-heading text-2xl font-semibold md:text-3xl">Core Pipeline</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="rounded-xl border bg-card/70 p-5">
              <p className="mb-2 text-sm font-semibold text-primary">1. Data Ingestion</p>
              <p className="text-sm text-muted-foreground">
                Fetch commits from GitHub, filter by time window, and extract commit messages, repository context, and optional file changes.
              </p>
            </article>
            <article className="rounded-xl border bg-card/70 p-5">
              <p className="mb-2 text-sm font-semibold text-primary">2. Metadata Generation</p>
              <p className="text-sm text-muted-foreground">
                Convert raw commit text into structured metadata with summaries, tags, categories, tone, complexity, and SEO keywords.
              </p>
            </article>
            <article className="rounded-xl border bg-card/70 p-5">
              <p className="mb-2 text-sm font-semibold text-primary">3. Content Generation</p>
              <p className="text-sm text-muted-foreground">
                Generate LinkedIn and X content plus optional website metadata including title, description, and searchable keywords.
              </p>
            </article>
            <article className="rounded-xl border bg-card/70 p-5">
              <p className="mb-2 text-sm font-semibold text-primary">4. Distribution Layer</p>
              <p className="text-sm text-muted-foreground">
                Publish to LinkedIn and X, then store entries as structured developer logs for your website.
              </p>
            </article>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-xl border bg-card/80 p-6">
            <h3 className="font-heading text-xl font-semibold">Metadata Output Example</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Input commits:
              added auth system, fixed payment bug, improved UI.
            </p>
            <pre className="mt-4 overflow-x-auto rounded-lg bg-muted/60 p-4 text-xs leading-relaxed md:text-sm">{`{
  "summary": "Worked on authentication, fixed payment issues, and improved UI",
  "tags": ["authentication", "bug fix", "UI improvement"],
  "category": "feature development",
  "tone": "progress update",
  "complexity": "medium",
  "keywords": ["web development", "frontend", "backend"]
}`}</pre>
          </article>

          <article className="rounded-xl border bg-card/80 p-6">
            <h3 className="font-heading text-xl font-semibold">Architecture</h3>
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <p>GitHub API</p>
              <p>↓</p>
              <p>Commit Fetcher</p>
              <p>↓</p>
              <p>AI Processing (metadata + content)</p>
              <p>↓</p>
              <p>JSON Output</p>
              <p>↓</p>
              <p>Social media posts and website metadata store</p>
            </div>
          </article>
        </section>

        <section className="space-y-4 rounded-xl border bg-card/80 p-6">
          <h3 className="font-heading text-xl font-semibold">One-line Definition</h3>
          <p className="text-base text-foreground md:text-lg">
            Kimmit is a tool that converts GitHub commits into structured metadata and automatically generates social content and developer logs.
          </p>
          <p className="text-sm text-muted-foreground">
            Kimmit is not just a post generator and not just a GitHub integration. It is a developer activity to structured data engine.
          </p>
        </section>
      </div>
    </div>
  )
}
