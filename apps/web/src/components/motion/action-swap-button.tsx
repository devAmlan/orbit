import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
	MotionButton,
	type MotionButtonProps,
} from "@/components/motion/motion-button";

export type ActionSwapButtonProps = Omit<MotionButtonProps, "onClick"> & {
	/**
	 * "pulse" swaps to the active state on click, then reverts on its own —
	 * for confirmations like "Copied!". "toggle" flips between the two states
	 * on every click and stays there — for persistent states like light/dark.
	 */
	mode?: "pulse" | "toggle";
	idleLabel: React.ReactNode;
	activeLabel: React.ReactNode;
	idleIcon?: React.ReactNode;
	activeIcon?: React.ReactNode;
	/** Milliseconds to hold the active state before reverting to idle. Only used in "pulse" mode. */
	resetAfter?: number;
	/** Extra classes applied only in the active state — e.g. a colored bg/border/text for a liked/saved look. */
	activeClassName?: string;
	onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
};

function ActionSwapButton({
	mode = "pulse",
	idleLabel,
	activeLabel,
	idleIcon,
	activeIcon = <CheckIcon className="size-4" />,
	resetAfter = 1600,
	activeClassName,
	onClick,
	className,
	...props
}: ActionSwapButtonProps) {
	const [active, setActive] = React.useState(false);

	React.useEffect(() => {
		if (mode !== "pulse" || !active) return;
		const timer = setTimeout(() => setActive(false), resetAfter);
		return () => clearTimeout(timer);
	}, [mode, active, resetAfter]);

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		setActive((prev) => (mode === "toggle" ? !prev : true));
		onClick?.(event);
	}

	return (
		<MotionButton
			onClick={handleClick}
			className={cn("overflow-hidden", className, active && activeClassName)}
			{...props}
		>
			<AnimatePresence mode="popLayout" initial={false}>
				<motion.span
					key={active ? "active" : "idle"}
					initial={{ y: 12, opacity: 0 }}
					animate={{ y: 0, opacity: 1 }}
					exit={{ y: -12, opacity: 0 }}
					transition={{ type: "spring", stiffness: 500, damping: 32 }}
					className="inline-flex items-center gap-1.5"
				>
					{active ? activeIcon : idleIcon}
					{active ? activeLabel : idleLabel}
				</motion.span>
			</AnimatePresence>
		</MotionButton>
	);
}

export { ActionSwapButton };
