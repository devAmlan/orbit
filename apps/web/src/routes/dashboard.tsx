import { PromptComposer } from '@/components/composer/prompt-composer'
import { useAppStore } from '@/store'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ location }) => {
    if (useAppStore.getState().authStatus === 'unauthenticated') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: () => (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <PromptComposer />
      </div>
    </div>
  ),
})
