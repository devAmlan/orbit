import { LoginCard } from '@/components/auth/login-card'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: () => (
    <div className="flex min-h-svh items-center justify-center p-4">
      <LoginCard redirectTo="/" />
    </div>
  ),
})
