import { CheckIcon, type LucideIcon } from "lucide-react"

import { MotionPopover } from "@/components/motion/motion-popover"
import { cn } from "@/lib/utils"

export type MotionSelectOption<T extends string> = {
	value: T
	label: string
	icon?: LucideIcon
	iconClassName?: string
}

export type MotionSelectProps<T extends string> = {
	value: T
	options: MotionSelectOption<T>[]
	onChange: (value: T) => void
	trigger: React.ReactNode
	align?: "start" | "center" | "end"
}

function MotionSelect<T extends string>({ value, options, onChange, trigger, align }: MotionSelectProps<T>) {
	return (
		<MotionPopover trigger={trigger} align={align}>
			{(close) => (
				<div className="flex flex-col">
					{options.map((option) => {
						const Icon = option.icon
						const selected = option.value === value

						return (
							<button
								key={option.value}
								type="button"
								onClick={() => {
									onChange(option.value)
									close()
								}}
								className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-muted"
							>
								{Icon && <Icon className={cn("size-3.5", option.iconClassName)} />}
								<span className="flex-1">{option.label}</span>
								{selected && <CheckIcon className="size-3.5" />}
							</button>
						)
					})}
				</div>
			)}
		</MotionPopover>
	)
}

export { MotionSelect }
