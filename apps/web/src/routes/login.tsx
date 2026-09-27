import { LoginCard } from '@/components/auth/login-card'
import { useAppStore } from '@/store'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === 'string' ? search.redirect : undefined,
  }),
  beforeLoad: () => {
    if (useAppStore.getState().authStatus === 'authenticated') {
      throw redirect({ to: '/dashboard' })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { redirect: redirectTo } = Route.useSearch()

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <LoginCard redirectTo={redirectTo ?? '/dashboard'} />
    </div>
  )
}
