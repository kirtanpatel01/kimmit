import { useMemo, useState } from "react"
import { createFileRoute } from "@tanstack/react-router"
import {
  IconBrandGithub,
  IconBrandLinkedin,
  IconBrandX,
  IconCheck,
  IconCircleDashed,
} from "@tabler/icons-react"

import { ModeToggle } from "@/components/mode-toggle"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export const Route = createFileRoute("/onboarding")({
  component: OnboardingRoute,
})

function OnboardingRoute() {
  const [currentStep, setCurrentStep] = useState(0)
  const [githubConnected, setGithubConnected] = useState(false)
  const [xConnected, setXConnected] = useState(false)
  const [linkedinConnected, setLinkedinConnected] = useState(false)
  const [showOptionalError, setShowOptionalError] = useState(false)
  const [completed, setCompleted] = useState(false)

  const progressValue = useMemo(() => ((currentStep + 1) / 3) * 100, [currentStep])
  const canFinish = githubConnected && (xConnected || linkedinConnected)

  const accessSteps = [
    {
      title: "GitHub",
      requirement: "Required",
      heading: "GitHub read access",
      description: "This connection is required to fetch your commit activity.",
      connected: githubConnected,
      connectedLabel: "Connected",
      disconnectedLabel: "Not connected",
      connectLabel: "Connect GitHub",
      connectedButtonLabel: "GitHub connected",
      buttonVariant: githubConnected ? "secondary" : "default",
      onToggle: () => setGithubConnected((prev) => !prev),
      icon: <IconBrandGithub data-icon="inline-start" />,
    },
    {
      title: "X",
      requirement: "Optional",
      heading: "X write access",
      description: "Optional. Connect this if you want to publish generated posts to X.",
      connected: xConnected,
      connectedLabel: "Connected",
      disconnectedLabel: "Skipped",
      connectLabel: "Connect X",
      connectedButtonLabel: "X connected",
      buttonVariant: xConnected ? "secondary" : "outline",
      onToggle: () => setXConnected((prev) => !prev),
      icon: <IconBrandX data-icon="inline-start" />,
    },
    {
      title: "LinkedIn",
      requirement: "Optional",
      heading: "LinkedIn write access",
      description: "Optional. You must connect at least one of X or LinkedIn before finishing.",
      connected: linkedinConnected,
      connectedLabel: "Connected",
      disconnectedLabel: "Skipped",
      connectLabel: "Connect LinkedIn",
      connectedButtonLabel: "LinkedIn connected",
      buttonVariant: linkedinConnected ? "secondary" : "outline",
      onToggle: () => setLinkedinConnected((prev) => !prev),
      icon: <IconBrandLinkedin data-icon="inline-start" />,
    },
  ] as const

  const currentAccessStep = accessSteps[currentStep]

  const completionSummary = [
    { title: "GitHub", status: "Read access enabled" },
    { title: "X", status: xConnected ? "Write access enabled" : "Skipped" },
    { title: "LinkedIn", status: linkedinConnected ? "Write access enabled" : "Skipped" },
  ] as const

  const goNext = () => {
    setShowOptionalError(false)
    setCurrentStep((prev) => Math.min(prev + 1, 2))
  }

  const goBack = () => {
    setShowOptionalError(false)
    setCurrentStep((prev) => Math.max(prev - 1, 0))
  }

  const completeOnboarding = () => {
    if (!canFinish) {
      setShowOptionalError(true)
      return
    }

    setCompleted(true)
  }

  const resetOnboarding = () => {
    setCurrentStep(0)
    setGithubConnected(false)
    setXConnected(false)
    setLinkedinConnected(false)
    setShowOptionalError(false)
    setCompleted(false)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_35%),radial-gradient(circle_at_80%_5%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent_40%)] p-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Onboarding</CardTitle>
            <CardDescription>Set up the access your workspace needs before continuing.</CardDescription>
            <CardAction>
              <ModeToggle />
            </CardAction>
          </CardHeader>

          <Separator />

          <CardContent>
            <div className="flex flex-col gap-6 py-2">
              {completed ? (
                <>
                  <Alert>
                    <IconCheck />
                    <AlertTitle>Onboarding complete</AlertTitle>
                    <AlertDescription>
                      GitHub access is connected and at least one social channel is enabled.
                    </AlertDescription>
                  </Alert>

                  <div className="grid gap-3 md:grid-cols-3">
                    {completionSummary.map((item) => (
                      <div key={item.title} className="rounded-xl border bg-card p-4">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.status}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-3">
                    <Progress value={progressValue} />
                    <div className="flex flex-wrap items-center gap-2">
                      {accessSteps.map((step, index) => (
                        <Badge
                          key={step.title}
                          variant={index < currentStep ? "secondary" : index === currentStep ? "default" : "outline"}
                        >
                          {index + 1}. {step.title} · {step.requirement}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border bg-card p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <p className="text-base font-medium">{currentAccessStep.heading}</p>
                        <p className="text-sm text-muted-foreground">{currentAccessStep.description}</p>
                      </div>
                      {currentAccessStep.connected ? (
                        <Badge>{currentAccessStep.connectedLabel}</Badge>
                      ) : (
                        <Badge variant="outline">{currentAccessStep.disconnectedLabel}</Badge>
                      )}
                    </div>

                    <div className="pt-5">
                      <Button type="button" variant={currentAccessStep.buttonVariant} onClick={currentAccessStep.onToggle}>
                        {currentAccessStep.icon}
                        {currentAccessStep.connected
                          ? currentAccessStep.connectedButtonLabel
                          : currentAccessStep.connectLabel}
                      </Button>
                    </div>
                  </div>

                  {showOptionalError ? (
                    <Alert variant="destructive">
                      <IconCircleDashed />
                      <AlertTitle>One social channel is required</AlertTitle>
                      <AlertDescription>
                        Connect at least one of X or LinkedIn before completing onboarding.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </>
              )}
            </div>
          </CardContent>

          <Separator />

          <CardFooter>
            <div className="flex w-full items-center justify-between gap-3 pt-2">
              {completed ? (
                <Button type="button" variant="outline" onClick={resetOnboarding}>
                  Run again
                </Button>
              ) : (
                <Button type="button" variant="outline" onClick={goBack} disabled={currentStep === 0}>
                  Back
                </Button>
              )}

              {completed ? (
                <Button type="button">Continue</Button>
              ) : currentStep < 2 ? (
                <Button type="button" onClick={goNext} disabled={currentStep === 0 && !githubConnected}>
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={completeOnboarding}>
                  Finish onboarding
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
