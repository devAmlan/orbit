import { SignupCard } from '@/components/auth/signup-card'
import { useAppStore } from '@/store'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  beforeLoad: () => {
    if (useAppStore.getState().authStatus === 'authenticated') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: () => (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SignupCard />
    </div>
  ),
})
