import * as React from "react";
import {
	AnimatePresence,
	motion,
	useReducedMotion,
	type HTMLMotionProps,
} from "framer-motion";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type MotionButtonProps = HTMLMotionProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		ref?: React.Ref<HTMLButtonElement>;
		/** Spawn a ripple from the press point. Off by default. */
		ripple?: boolean;
	};

type Ripple = { id: number; x: number; y: number; size: number };

const pressTransition = {
	type: "spring",
	stiffness: 500,
	damping: 30,
} as const;

export function MotionButton({
	ref,
	className,
	variant = "default",
	size = "default",
	ripple = false,
	onPointerDown,
	children,
	...props
}: MotionButtonProps) {
	const reduceMotion = useReducedMotion();
	const [ripples, setRipples] = React.useState<Ripple[]>([]);
	const nextId = React.useRef(0);

	function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
		if (ripple && !reduceMotion) {
			const rect = event.currentTarget.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height) * 2;
			nextId.current += 1;
			setRipples((prev) => [
				...prev,
				{
					id: nextId.current,
					x: event.clientX - rect.left,
					y: event.clientY - rect.top,
					size,
				},
			]);
		}
		onPointerDown?.(event);
	}

	return (
		<motion.button
			ref={ref}
			data-slot="button"
			data-variant={variant}
			data-size={size}
			whileHover={reduceMotion ? undefined : { scale: 1.03 }}
			whileTap={reduceMotion ? undefined : { scale: 0.97 }}
			transition={pressTransition}
			onPointerDown={handlePointerDown}
			className={cn(
				buttonVariants({ variant, size, className }),
				ripple && "relative overflow-hidden",
			)}
			{...props}
		>
			{ripple && !reduceMotion && (
				<span className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
					<AnimatePresence>
						{ripples.map((r) => (
							<motion.span
								key={r.id}
								className="absolute rounded-full bg-current/25"
								style={{
									left: r.x,
									top: r.y,
									width: r.size,
									height: r.size,
									x: "-50%",
									y: "-50%",
								}}
								initial={{ scale: 0, opacity: 0.4 }}
								animate={{ scale: 1, opacity: 0 }}
								transition={{ duration: 0.6, ease: "easeOut" }}
								onAnimationComplete={() =>
									setRipples((prev) => prev.filter((x) => x.id !== r.id))
								}
							/>
						))}
					</AnimatePresence>
				</span>
			)}
			{children as React.ReactNode}
		</motion.button>
	);
}
