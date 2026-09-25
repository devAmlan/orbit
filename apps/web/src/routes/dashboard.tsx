import { PromptComposer } from '@/components/composer/prompt-composer'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard')({
  component: () => (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <PromptComposer />
      </div>
    </div>
  ),
})
