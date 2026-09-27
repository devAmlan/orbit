import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { AnimatePresence, motion } from "framer-motion"

import { cn } from "@/lib/utils"

export type MotionPopoverProps = {
	trigger: React.ReactNode
	children: React.ReactNode | ((close: () => void) => React.ReactNode)
	align?: "start" | "center" | "end"
	className?: string
}

function MotionPopover({ trigger, children, align = "start", className }: MotionPopoverProps) {
	const [open, setOpen] = React.useState(false)

	return (
		<PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
			<PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
			<PopoverPrimitive.Portal forceMount>
				<AnimatePresence>
					{open && (
						<PopoverPrimitive.Content asChild forceMount align={align} sideOffset={6}>
							<motion.div
								initial={{ opacity: 0, scale: 0.96, y: -4 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.96, y: -4 }}
								transition={{ duration: 0.15, ease: "easeOut" }}
								className={cn(
									"z-50 min-w-40 overflow-hidden rounded-lg border bg-popover p-1 text-popover-foreground shadow-md",
									className,
								)}
							>
								{typeof children === "function" ? children(() => setOpen(false)) : children}
							</motion.div>
						</PopoverPrimitive.Content>
					)}
				</AnimatePresence>
			</PopoverPrimitive.Portal>
		</PopoverPrimitive.Root>
	)
}

export { MotionPopover }
