import Header from "@/components/header"
import RepoCommitsPanel from "@/components/repo-commits-panel"
import SelectedCommitsJsonPanel from "@/components/selected-commits-json-panel"
import { getSession } from "@/lib/auth.functions"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async () => {
    const session = await getSession()
    return { session: session ?? null }
  }
})

function HomePage() {
  const { session } = Route.useLoaderData();

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header session={session} />

      {session ? (
        <div className="grid min-h-0 flex-1 gap-4 px-4 pb-4 lg:grid-cols-2">
          <RepoCommitsPanel />
          <SelectedCommitsJsonPanel />
        </div>
      ) : (
        <div className="px-4">
          <p>Please sign in to continue.</p>
        </div>
      )}
    </div>
  )
}
