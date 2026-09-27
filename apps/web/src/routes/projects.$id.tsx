import { ProjectBoard } from '@/components/board/project-board'
import { useAppStore } from '@/store'
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/projects/$id')({
  beforeLoad: ({ location }) => {
    if (useAppStore.getState().authStatus === 'unauthenticated') {
      throw redirect({ to: '/login', search: { redirect: location.href } })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { id } = Route.useParams()

  return (
    <div className="min-h-svh p-4 sm:p-8">
      <div className="mx-auto w-full space-y-4">
        <ProjectBoard id={id} />
      </div>
    </div>
  )
}
