import { SignupCard } from '@/components/auth/signup-card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/signup')({
  component: () => (
    <div className="flex min-h-svh items-center justify-center p-4">
      <SignupCard />
    </div>
  ),
})
