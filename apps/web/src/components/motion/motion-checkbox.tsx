import * as React from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "framer-motion";
import { CheckIcon, MinusIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;

function Checkbox({
	className,
	checked,
	defaultChecked,
	onCheckedChange,
	...props
}: CheckboxProps) {
	const [internalChecked, setInternalChecked] = React.useState<
		boolean | "indeterminate"
	>(defaultChecked ?? false);
	const resolvedChecked = checked ?? internalChecked;

	function handleCheckedChange(next: boolean | "indeterminate") {
		setInternalChecked(next);
		onCheckedChange?.(next);
	}

	return (
		<CheckboxPrimitive.Root
			asChild
			checked={resolvedChecked}
			onCheckedChange={handleCheckedChange}
			{...props}
		>
			<motion.button
				data-slot="checkbox"
				whileTap={{ scale: 0.9 }}
				transition={{ type: "spring", stiffness: 500, damping: 30 }}
				className={cn(
					"peer flex size-5 shrink-0 items-center justify-center rounded-md border border-input bg-transparent text-current outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:border-primary data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground",
					className,
				)}
			>
				<CheckboxPrimitive.Indicator
					data-slot="checkbox-indicator"
					forceMount
					className="flex items-center justify-center"
				>
					<AnimatePresence mode="wait" initial={false}>
						{resolvedChecked !== false && (
							<motion.span
								key={
									resolvedChecked === "indeterminate"
										? "indeterminate"
										: "checked"
								}
								initial={{ scale: 0, opacity: 0 }}
								animate={{ scale: 1, opacity: 1 }}
								exit={{ scale: 0, opacity: 0 }}
								transition={{ type: "spring", stiffness: 600, damping: 20 }}
								className="flex items-center justify-center"
							>
								{resolvedChecked === "indeterminate" ? (
									<MinusIcon className="size-3.5" />
								) : (
									<CheckIcon className="size-3.5" />
								)}
							</motion.span>
						)}
					</AnimatePresence>
				</CheckboxPrimitive.Indicator>
			</motion.button>
		</CheckboxPrimitive.Root>
	);
}

export { Checkbox };
