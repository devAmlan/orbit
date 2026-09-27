import { useAppStore } from '@/store'
import { createRootRoute, Outlet } from '@tanstack/react-router'

export const Route = createRootRoute({
  beforeLoad: async () => {
    if (useAppStore.getState().authStatus === 'idle') {
      await useAppStore.getState().hydrate()
    }
  },
  component: () => <Outlet />,
})
