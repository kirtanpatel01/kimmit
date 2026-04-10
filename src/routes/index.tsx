import { createFileRoute } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"

export const Route = createFileRoute("/")({ component: App })

function App() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-lg min-w-0 flex-col gap-4 text-sm leading-loose">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">Kimmit</h1>
          <ModeToggle />
        </div>
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-base">
            Convert GitHub commits into structured metadata and automatically
            generate social content and developer logs.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm">Get Started</Button>
            <Button size="sm" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
