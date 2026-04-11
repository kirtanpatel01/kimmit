import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { authClient } from '@/lib/auth-client'
import { IconBrandGithub, IconBrandGoogle, IconLoader2 } from '@tabler/icons-react'
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ModeToggle } from '@/components/mode-toggle'
import { Separator } from '@/components/ui/separator'

export const Route = createFileRoute('/auth/login')({
  component: RouteComponent,
})

function RouteComponent() {
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const signIn = async (provider: 'github' | 'google') => {
    setError(null)
    setLoadingProvider(provider)

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: '/',
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to start sign in')
      setLoadingProvider(null)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-6'>
      <ModeToggle className='absolute top-4 right-4' />
      <Card className='w-full max-w-72'>
        <CardHeader className='text-center'>
          <CardTitle>Login</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>
        <Separator />
        <CardContent className='flex flex-col items-center gap-3'>
          <Button
            type='button'
            variant='outline'
            className='w-fit gap-3'
            onClick={() => signIn('github')}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'github' ? <IconLoader2 className='size-4 animate-spin' /> : <IconBrandGithub className='size-4' />}
            <span>{loadingProvider === 'github' ? 'Redirecting to GitHub...' : 'Continue with GitHub'}</span>
          </Button>
          <Button
            type='button'
            variant='outline'
            className='w-fit gap-3'
            onClick={() => signIn('google')}
            disabled={loadingProvider !== null}
          >
            {loadingProvider === 'google' ? <IconLoader2 className='size-4 animate-spin' /> : <IconBrandGoogle className='size-4' />}
            <span>{loadingProvider === 'google' ? 'Redirecting to Google...' : 'Continue with Google'}</span>
          </Button>
          {error ? <p className='text-sm text-destructive'>{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
