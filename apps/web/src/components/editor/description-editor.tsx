import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

import { cn } from "@/lib/utils"

export type DescriptionEditorProps = {
	content: string
	onChange: (html: string) => void
	placeholder?: string
	className?: string
}

const PROSE_CLASSNAME = cn(
	"min-h-16 text-sm leading-relaxed text-foreground outline-none",
	"[&_p]:m-0 [&_p+p]:mt-2",
	"[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5",
	"[&_strong]:font-semibold [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
	"[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
	"[&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-muted-foreground [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
)

function DescriptionEditor({ content, onChange, placeholder = "Add a description…", className }: DescriptionEditorProps) {
	const editor = useEditor({
		extensions: [StarterKit, Placeholder.configure({ placeholder })],
		content,
		editorProps: { attributes: { class: cn(PROSE_CLASSNAME, className) } },
		onUpdate: ({ editor }) => onChange(editor.getHTML()),
	})

	return <EditorContent editor={editor} />
}

export { DescriptionEditor }
