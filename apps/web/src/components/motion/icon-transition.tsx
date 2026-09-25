import * as React from "react"
import { AnimatePresence, motion, type TargetAndTransition } from "framer-motion"

import { cn } from "@/lib/utils"

export type IconTransitionVariant = "direct" | "blur" | "blur-scale"

export type IconTransitionProps = {
  icon: React.ReactNode
  transitionKey: React.Key
  variant?: IconTransitionVariant
  blur?: number
  duration?: number
  className?: string
}

function IconTransition({
  icon,
  transitionKey,
  variant = "blur",
  blur = 6,
  duration = 0.22,
  className,
}: IconTransitionProps) {
  const faded: TargetAndTransition = { opacity: 0, filter: `blur(${blur}px)` }
  const settled: TargetAndTransition = { opacity: 1, filter: "blur(0px)" }
  const states: Record<IconTransitionVariant, { initial: TargetAndTransition; animate: TargetAndTransition; exit: TargetAndTransition }> = {
    direct: { initial: {}, animate: {}, exit: {} },
    blur: { initial: faded, animate: settled, exit: faded },
    "blur-scale": {
      initial: { ...faded, scale: 0.5 },
      animate: { ...settled, scale: 1 },
      exit: { ...faded, scale: 0.5 },
    },
  }
  const { initial, animate, exit } = states[variant]

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={transitionKey}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={{ duration: variant === "direct" ? 0 : duration }}
        className={cn("inline-flex", className)}
      >
        {icon}
      </motion.span>
    </AnimatePresence>
  )
}

export { IconTransition }
