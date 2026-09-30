import * as React from "react";
import { DropdownMenu as DropdownMenuPrimitive } from "radix-ui";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "@tanstack/react-router";
import { BoardSchema } from "@orbit/types";
import { generateBoard } from "@/services/ai";
import { useAppStore } from "@/store";
import {
	ArrowUpIcon,
	CheckIcon,
	ChevronDownIcon,
	CornerDownRightIcon,
	FolderIcon,
	GitBranchIcon,
	ImageIcon,
	MicIcon,
	PaperclipIcon,
	PlusIcon,
	SquareIcon,
	TelescopeIcon,
	XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconTransition } from "@/components/motion/icon-transition";

const MODELS = ["Opus 4.8", "Sonnet 5", "Haiku 4.5"];
const PROJECTS = ["No project", "Orbit Web", "Marketing Site", "Internal Tools"];
const CARET_COLORS = ["#4285F4", "#EA4335", "#FBBC05", "#34A853"];
const CARET_BLINK_MS = 530;
const RECORD_MS = 1800;
const TRANSCRIPT = "How do micro-interactions make an interface feel alive?";

const growMenuVariants = {
	hidden: { opacity: 0, scaleX: 0.4, scaleY: 0.3 },
	visible: {
		opacity: 1,
		scaleX: 1,
		scaleY: 1,
		transition: {
			type: "spring" as const,
			stiffness: 420,
			damping: 28,
			staggerChildren: 0.03,
			delayChildren: 0.04,
		},
	},
	exit: {
		opacity: 0,
		scaleX: 0.5,
		scaleY: 0.4,
		transition: { duration: 0.12, ease: [0.4, 0, 1, 1] as const },
	},
};

const growMenuItemVariants = {
	hidden: { opacity: 0, x: -6 },
	visible: {
		opacity: 1,
		x: 0,
		transition: { type: "spring" as const, stiffness: 500, damping: 32 },
	},
};

const SUGGESTIONS = [
	"Turn this GitHub repo into a sprint board",
	"Plan a marketplace app for handmade crafts",
	"Break down a mobile fitness app from a rough idea",
];

const CONTEXT_OPTIONS = [
	{
		key: "files",
		icon: PaperclipIcon,
		title: "Upload files",
		subtitle: "PDF, Markdown or TXT · max 5",
	},
	{
		key: "screenshot",
		icon: ImageIcon,
		title: "Add screenshot",
		subtitle: "PNG, JPEG or WebP · max 5",
	},
	{
		key: "repo",
		icon: GitBranchIcon,
		title: "Connect repo",
		subtitle: "Public GitHub repo",
	},
];

/** Attach ("+") button's menu — same corner-grow motion as GrowMenu, but two-line items with an icon chip instead of a checkmark list. */
function AddContextMenu({ onSelect }: { onSelect: (key: string) => void }) {
	const [open, setOpen] = React.useState(false);

	return (
		<DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
			<DropdownMenuPrimitive.Trigger asChild>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="shrink-0 rounded-full"
				>
					<PlusIcon />
				</Button>
			</DropdownMenuPrimitive.Trigger>
			<AnimatePresence>
				{open && (
					<DropdownMenuPrimitive.Portal forceMount>
						<DropdownMenuPrimitive.Content
							forceMount
							align="start"
							sideOffset={6}
							className="z-50 min-w-64 overflow-hidden rounded-xl"
						>
							<motion.div
								variants={growMenuVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								style={{ transformOrigin: "top left" }}
								className="rounded-xl border bg-popover p-1.5 text-popover-foreground shadow-md"
							>
								<p className="px-2 pt-1 pb-1.5 text-xs font-medium text-muted-foreground">
									Add context
								</p>
								{CONTEXT_OPTIONS.map((option) => {
									const Icon = option.icon;
									return (
										<DropdownMenuPrimitive.Item
											key={option.key}
											asChild
											onSelect={() => onSelect(option.key)}
										>
											<motion.div
												variants={growMenuItemVariants}
												whileHover={{ x: 3 }}
												className="flex cursor-default items-center gap-2.5 rounded-lg px-2 py-2 text-sm outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
											>
												<span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
													<Icon className="size-3 text-muted-foreground" />
												</span>
												<span className="min-w-0">
													<span className="block font-medium">
														{option.title}
													</span>
													<span className="block text-xs text-muted-foreground">
														{option.subtitle}
													</span>
												</span>
											</motion.div>
										</DropdownMenuPrimitive.Item>
									);
								})}
							</motion.div>
						</DropdownMenuPrimitive.Content>
					</DropdownMenuPrimitive.Portal>
				)}
			</AnimatePresence>
		</DropdownMenuPrimitive.Root>
	);
}

type GrowMenuItem = {
	key: string;
	label: string;
	icon?: React.ComponentType<{ className?: string }>;
	selected: boolean;
};

/** Dropdown used by the model picker — grows from the trigger corner instead of fading/blurring in. */
function GrowMenu({
	trigger,
	items,
	onSelect,
	align = "start",
	contentClassName,
}: {
	trigger: React.ReactNode;
	items: GrowMenuItem[];
	onSelect: (key: string) => void;
	align?: "start" | "end";
	contentClassName?: string;
}) {
	const [open, setOpen] = React.useState(false);

	return (
		<DropdownMenuPrimitive.Root open={open} onOpenChange={setOpen}>
			<DropdownMenuPrimitive.Trigger asChild>
				{trigger}
			</DropdownMenuPrimitive.Trigger>
			<AnimatePresence>
				{open && (
					<DropdownMenuPrimitive.Portal forceMount>
						<DropdownMenuPrimitive.Content
							forceMount
							align={align}
							sideOffset={6}
							className={cn(
								"z-50 min-w-36 overflow-hidden rounded-lg",
								contentClassName,
							)}
						>
							<motion.div
								variants={growMenuVariants}
								initial="hidden"
								animate="visible"
								exit="exit"
								style={{
									transformOrigin: align === "end" ? "top right" : "top left",
								}}
								className="rounded-lg border bg-popover p-1 text-popover-foreground shadow-md"
							>
								{items.map((item) => {
									const Icon = item.icon;
									return (
										<DropdownMenuPrimitive.Item
											key={item.key}
											asChild
											onSelect={() => onSelect(item.key)}
										>
											<motion.div
												variants={growMenuItemVariants}
												whileHover={{ x: 3 }}
												className="flex cursor-default items-center gap-1.5 rounded-md px-2 py-1.5 text-sm whitespace-nowrap outline-hidden select-none focus:bg-accent focus:text-accent-foreground"
											>
												{Icon ? (
													<Icon className="size-3.5 text-muted-foreground" />
												) : (
													<CheckIcon
														className={cn(
															"size-3.5",
															item.selected ? "opacity-100" : "opacity-0",
														)}
													/>
												)}
												{item.label}
												{Icon && (
													<CheckIcon
														className={cn(
															"ml-auto size-3.5",
															item.selected ? "opacity-100" : "opacity-0",
														)}
													/>
												)}
											</motion.div>
										</DropdownMenuPrimitive.Item>
									);
								})}
							</motion.div>
						</DropdownMenuPrimitive.Content>
					</DropdownMenuPrimitive.Portal>
				)}
			</AnimatePresence>
		</DropdownMenuPrimitive.Root>
	);
}

function ModelMenu({
	model,
	onSelect,
}: {
	model: string;
	onSelect: (model: string) => void;
}) {
	return (
		<GrowMenu
			align="end"
			trigger={
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="shrink-0 rounded-full text-sm text-muted-foreground"
				>
					{model}
					<ChevronDownIcon className="size-3" />
				</Button>
			}
			items={MODELS.map((m) => ({ key: m, label: m, selected: m === model }))}
			onSelect={onSelect}
		/>
	);
}

function ProjectMenu({
	project,
	onSelect,
}: {
	project: string;
	onSelect: (project: string) => void;
}) {
	return (
		<GrowMenu
			align="start"
			trigger={
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="shrink-0 gap-1.5 rounded-full border border-dashed text-sm text-muted-foreground"
				>
					<FolderIcon className="size-4" />
					<span className="leading-none">{project}</span>
					<ChevronDownIcon className="size-3" />
				</Button>
			}
			items={PROJECTS.map((p) => ({
				key: p,
				label: p,
				selected: p === project,
			}))}
			onSelect={onSelect}
		/>
	);
}

/** Mimics Google AI search's caret: blinks on/off, cycling brand colors each time it blinks on. */
function ColorCycleCaret() {
	const [visible, setVisible] = React.useState(true);
	const [colorIndex, setColorIndex] = React.useState(0);

	React.useEffect(() => {
		const id = setInterval(() => {
			setVisible((prev) => {
				const next = !prev;
				if (next) setColorIndex((i) => (i + 1) % CARET_COLORS.length);
				return next;
			});
		}, CARET_BLINK_MS);
		return () => clearInterval(id);
	}, []);

	return (
		<motion.span
			aria-hidden
			animate={{ opacity: visible ? 1 : 0 }}
			transition={{ duration: 0.08 }}
			style={{ backgroundColor: CARET_COLORS[colorIndex] }}
			className="pointer-events-none absolute top-0.5 left-0 h-5 w-0.5 rounded-full"
		/>
	);
}

type ContextItem = { id: number; label: string; icon: React.ReactNode };

function Chip({ item, onRemove }: { item: ContextItem; onRemove: () => void }) {
	return (
		<motion.span
			layout
			initial={{ opacity: 0, scale: 0.8, y: -4 }}
			animate={{ opacity: 1, scale: 1, y: 0 }}
			exit={{ opacity: 0, scale: 0.8 }}
			transition={{ type: "spring", stiffness: 500, damping: 30 }}
			className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground"
		>
			{item.icon}
			{item.label}
			<button
				type="button"
				onClick={onRemove}
				className="ml-0.5 rounded-full text-muted-foreground hover:text-foreground"
			>
				<XIcon className="size-3" />
			</button>
		</motion.span>
	);
}

export type PromptComposerProps = React.ComponentProps<"div">;

function PromptComposer({ className, ...props }: PromptComposerProps) {
	const [text, setText] = React.useState("");
	const [focused, setFocused] = React.useState(false);
	const [model, setModel] = React.useState(MODELS[0]);
	const [project, setProject] = React.useState(PROJECTS[0]);
	const [research, setResearch] = React.useState(false);
	const [recording, setRecording] = React.useState(false);
	const [contextItems, setContextItems] = React.useState<ContextItem[]>([]);
	const [status, setStatus] = React.useState<"idle" | "streaming">("idle");
	const [error, setError] = React.useState<string | null>(null);

	const textareaRef = React.useRef<HTMLTextAreaElement>(null);
	const fileInputRef = React.useRef<HTMLInputElement>(null);
	const nextId = React.useRef(0);
	const recordTimeoutRef =
		React.useRef<ReturnType<typeof setTimeout>>(undefined);
	const abortRef = React.useRef<AbortController | null>(null);
	const navigate = useNavigate();
	const draftStart = useAppStore((s) => s.start);
	const draftCancel = useAppStore((s) => s.cancel);
	const draftCommit = useAppStore((s) => s.commit);
	const createBoard = useAppStore((s) => s.create);
	const addItem = useAppStore((s) => s.add);

	React.useEffect(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = "auto";
		el.style.height = `${Math.min(el.scrollHeight, 280)}px`;
	}, [text]);

	React.useEffect(() => () => clearTimeout(recordTimeoutRef.current), []);

	function addContextItem(label: string, icon: React.ReactNode) {
		nextId.current += 1;
		setContextItems((prev) => [...prev, { id: nextId.current, label, icon }]);
	}

	function removeContextItem(id: number) {
		setContextItems((prev) => prev.filter((item) => item.id !== id));
	}

	function toggleRecording() {
		if (recording) {
			clearTimeout(recordTimeoutRef.current);
			setRecording(false);
			return;
		}
		setRecording(true);
		recordTimeoutRef.current = setTimeout(() => {
			setRecording(false);
			setText((prev) => (prev ? `${prev} ${TRANSCRIPT}` : TRANSCRIPT));
		}, RECORD_MS);
	}

	async function handleSend() {
		if (status === "streaming") {
			abortRef.current?.abort();
			draftCancel();
			setStatus("idle");
			return;
		}
		if (!text.trim()) return;

		setError(null);
		setStatus("streaming");
		draftStart();
		const controller = new AbortController();
		abortRef.current = controller;
		const id = crypto.randomUUID();
		let buffer = "";

		try {
			for await (const event of generateBoard(text, controller.signal)) {
				if (event.event === "delta") buffer += event.data.json;
				else if (event.event === "error") throw new Error(event.data.message);
			}
			const board = BoardSchema.parse(JSON.parse(buffer));
			createBoard(
				{ id, projectName: board.projectName, summary: board.summary, updatedAt: Date.now() },
				board.states,
			);
			for (const item of board.items) addItem(item);
			draftCommit();
			setText("");
			navigate({ to: "/projects/$id", params: { id } });
		} catch (err) {
			if (!controller.signal.aborted) {
				setError(err instanceof Error ? err.message : "Something went wrong");
				draftCancel();
			}
		} finally {
			setStatus("idle");
		}
	}

	return (
		<div className="w-full space-y-6">
			<h1 className="text-center text-3xl font-semibold tracking-tight sm:text-4xl">
				What are you building?
			</h1>

			<div
				data-slot="prompt-composer"
				className={cn(
					"w-full rounded-3xl border bg-popover p-4 shadow-sm transition-all duration-300",
					focused && "border-ring ring-3 ring-ring/50",
					className,
				)}
				{...props}
			>
				<AnimatePresence initial={false}>
					{contextItems.length > 0 && (
						<motion.div layout className="flex flex-wrap gap-1.5">
							{contextItems.map((item) => (
								<Chip
									key={item.id}
									item={item}
									onRemove={() => removeContextItem(item.id)}
								/>
							))}
						</motion.div>
					)}
				</AnimatePresence>

				<div className="relative mt-3">
					{focused && !text && <ColorCycleCaret />}
					<textarea
						ref={textareaRef}
						data-slot="prompt-composer-field"
						value={text}
						onChange={(e) => setText(e.target.value)}
						onFocus={() => setFocused(true)}
						onBlur={() => setFocused(false)}
						rows={3}
						placeholder="Describe what you're building…"
						className={cn(
							"max-h-70 w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground",
							!text && "caret-transparent",
						)}
					/>
				</div>

				<div className="mt-3 flex flex-wrap items-center gap-1.5">
					<input
						ref={fileInputRef}
						type="file"
						accept=".pdf,.md,.txt"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0];
							if (file)
								addContextItem(file.name, <PaperclipIcon className="size-3" />);
							e.target.value = "";
						}}
					/>
					<AddContextMenu
						onSelect={(key) => {
							if (key === "files") {
								fileInputRef.current?.click();
								return;
							}
							const option = CONTEXT_OPTIONS.find((o) => o.key === key);
							if (!option) return;
							const Icon = option.icon;
							addContextItem(option.title, <Icon className="size-3" />);
						}}
					/>
					<ProjectMenu project={project} onSelect={setProject} />

					<motion.button
						type="button"
						onClick={() => setResearch((v) => !v)}
						whileHover={{ scale: 1.03 }}
						whileTap={{ scale: 0.97 }}
						transition={{ type: "spring", stiffness: 400, damping: 25 }}
						className={cn(
							buttonVariants({ variant: "ghost", size: "sm" }),
							"shrink-0 rounded-full border text-sm transition-colors duration-300",
							research
								? "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400"
								: "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
						)}
					>
						<IconTransition
							variant="blur-scale"
							transitionKey={research ? "on" : "off"}
							duration={0.25}
							icon={
								<motion.span
									animate={{ rotate: research ? -20 : 0 }}
									transition={{ type: "spring", stiffness: 400, damping: 20 }}
									className="inline-flex"
								>
									<TelescopeIcon className="size-4" />
								</motion.span>
							}
						/>
						<span className="leading-none">Research</span>
					</motion.button>

					<div className="ml-auto flex items-center gap-1.5">
						<ModelMenu model={model} onSelect={setModel} />

						<Button
							type="button"
							variant="ghost"
							size="icon-sm"
							className={cn(
								"relative shrink-0 rounded-full",
								recording && "text-destructive",
							)}
							onClick={toggleRecording}
						>
							{recording && (
								<motion.span
									animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
									transition={{
										duration: 1.2,
										repeat: Infinity,
										ease: "easeInOut",
									}}
									className="absolute inset-0 rounded-full bg-destructive/20"
								/>
							)}
							<AnimatePresence mode="wait" initial={false}>
								{recording ? (
									<motion.span
										key="recording"
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.5 }}
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
										className="relative flex items-center justify-center"
									>
										<span className="size-2.5 rounded-full bg-destructive" />
									</motion.span>
								) : (
									<motion.span
										key="mic"
										initial={{ opacity: 0, scale: 0.5 }}
										animate={{ opacity: 1, scale: 1 }}
										exit={{ opacity: 0, scale: 0.5 }}
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
										className="relative flex items-center justify-center"
									>
										<MicIcon />
									</motion.span>
								)}
							</AnimatePresence>
						</Button>

						<Button
							type="button"
							size="icon-sm"
							className="shrink-0 rounded-full"
							onClick={handleSend}
							disabled={status === "idle" && !text.trim()}
						>
							<AnimatePresence mode="wait" initial={false}>
								{status === "streaming" ? (
									<motion.span
										key="stop"
										initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
										animate={{ scale: 1, opacity: 1, rotate: 0 }}
										exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
										className="flex items-center justify-center"
									>
										<SquareIcon className="size-3 fill-current" />
									</motion.span>
								) : (
									<motion.span
										key="send"
										initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
										animate={{ scale: 1, opacity: 1, rotate: 0 }}
										exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
										className="flex items-center justify-center"
									>
										<ArrowUpIcon />
									</motion.span>
								)}
							</AnimatePresence>
						</Button>
					</div>
				</div>
			</div>

			{error && <p className="text-center text-sm text-destructive">{error}</p>}

			{!text && (
				<div className="flex flex-wrap justify-center gap-2">
					{SUGGESTIONS.map((suggestion) => (
						<button
							key={suggestion}
							type="button"
							onClick={() => {
								setText(suggestion);
								textareaRef.current?.focus();
							}}
							className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
						>
							<CornerDownRightIcon className="size-3.5" />
							{suggestion}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export { PromptComposer };
