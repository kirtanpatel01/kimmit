import { authClient } from '@/lib/auth-client';
import { useState } from 'react'
import { toast } from 'sonner';
import { Button } from './ui/button';
import { IconLogout } from '@tabler/icons-react';
import { ModeToggle } from './mode-toggle';
import type { Session, User } from 'better-auth';
import { useRouter } from '@tanstack/react-router';

interface SessionType {
  user: User;
  session: Session;
}

function Header({ session }: { session: SessionType | null }) {
  const [loadingSignin, setLoadingSignin] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const router = useRouter();

  const signIn = async () => {
    setLoadingSignin(true);
    try {
      await authClient.signIn.social({
        provider: 'github',
        callbackURL: '/',
      })

    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to start sign in")
      console.log("Error while sign in using github!")
    } finally {
      setLoadingSignin(false);
    }
  }

  const handleLogout = async () => {
    setLoadingLogout(true);
    try {
      await authClient.signOut();
      await router.invalidate();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to log out");
    } finally {
      setLoadingLogout(false);
    }
  };


  return (
    <header className="flex justify-between items-center p-4">
        <h1 className="text-xl font-bold text-primary bg-chart-1/3 px-2 py-1">
          Kimmit
        </h1>
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center">
              <span className="text-primary bg-secondary/50 px-2 py-1 border border-dotted">{session?.user.name}</span>
              <Button 
                variant="destructive" 
                size="icon" 
                onClick={handleLogout} 
                disabled={loadingLogout}
              >
                <IconLogout className="size-4" />
              </Button>
            </div>
          ) : (
            <Button className="" onClick={signIn} disabled={loadingSignin}>
              {loadingSignin ? "Signing in..." : "Login to GitHub"}
            </Button>
          )}
          <ModeToggle />
        </div>
      </header>
  )
}

export default Header