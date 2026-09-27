import { MotionPopover } from "@/components/motion/motion-popover"
import { Calendar } from "@/components/ui/calendar"

export type MotionCalendarProps = {
	value: Date
	onChange: (date: Date) => void
	trigger: React.ReactNode
	align?: "start" | "center" | "end"
}

function MotionCalendar({ value, onChange, trigger, align }: MotionCalendarProps) {
	return (
		<MotionPopover trigger={trigger} align={align} className="w-auto p-2">
			{(close) => (
				<Calendar
					mode="single"
					selected={value}
					defaultMonth={value}
					onSelect={(date) => {
						if (!date) return
						onChange(date)
						close()
					}}
				/>
			)}
		</MotionPopover>
	)
}

export { MotionCalendar }
