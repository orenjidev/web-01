"use client";

import { useEffect, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { ResizableImage } from "@/components/ui/resizable-image";
import { TextStyle, FontSize } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Underline } from "@tiptap/extension-underline";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Link } from "@tiptap/extension-link";
import { TextAlign } from "@tiptap/extension-text-align";

/* ─── Toolbar Button ────────────────────────────────── */
function ToolBtn({
  onClick,
  active,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        "h-7 min-w-7 px-1.5 rounded text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-muted text-foreground",
        disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px", "36px", "48px"];

/* ─── Props ─────────────────────────────────────────── */
export type NewsEditorProps = {
  initialHtml?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
};

/* ─── Component ─────────────────────────────────────── */
export function NewsRichEditor({ initialHtml = "", onChange, placeholder }: NewsEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextStyle,
      FontSize,
      Color,
      ResizableImage.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Write your article here…" }),
    ],
    content: initialHtml || "",
    editorProps: {
      attributes: {
        class: "min-h-[300px] px-6 py-4 focus:outline-none text-sm leading-relaxed",
      },
      handleDrop(view, event) {
        const files = event.dataTransfer?.files;
        if (!files?.length) return false;
        for (const file of Array.from(files)) {
          if (!file.type.startsWith("image/")) continue;
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src) view.dispatch(view.state.tr.replaceSelectionWith(
              view.state.schema.nodes.image.create({ src })
            ));
          };
          reader.readAsDataURL(file);
        }
        return true;
      },
      handlePaste(_, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (const item of Array.from(items)) {
          if (!item.type.startsWith("image/")) continue;
          const file = item.getAsFile();
          if (!file) continue;
          event.preventDefault();
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) editor.chain().focus().setImage({ src }).run();
          };
          reader.readAsDataURL(file);
          return true;
        }
        return false;
      },
    },
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  /* Sync initialHtml when it changes (e.g. loading an existing article) */
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (initialHtml && initialHtml !== current) {
      editor.commands.setContent(initialHtml, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialHtml]);

  const insertImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !editor) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) editor.chain().focus().setImage({ src }).run();
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [editor]);

  const setFontSize = useCallback((size: string) => {
    if (!editor) return;
    editor.chain().focus().setFontSize(size).run();
  }, [editor]);

  const setLink = useCallback(() => {
    const prev = editor?.getAttributes("link").href ?? "";
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (!url) { editor?.chain().focus().unsetLink().run(); return; }
    editor?.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-border bg-muted/20 shrink-0">
        {/* Undo / Redo */}
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">↩</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">↪</ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Headings */}
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">H1</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">H2</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">H3</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setParagraph().run()} active={editor.isActive("paragraph")} title="Paragraph">¶</ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Inline formatting */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold"><b>B</b></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic"><i>I</i></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline"><u>U</u></ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough"><s>S</s></ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Font size */}
        <select
          title="Font size"
          className="h-7 text-xs px-1 rounded border border-border bg-background focus:outline-none cursor-pointer"
          onChange={(e) => setFontSize(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>Size</option>
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Lists */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">• List</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">1. List</ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Alignment */}
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">≪</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">≡</ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">≫</ToolBtn>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Link */}
        <ToolBtn onClick={setLink} active={editor.isActive("link")} title="Link">🔗</ToolBtn>

        {/* Image upload */}
        <ToolBtn onClick={insertImage} title="Insert image">🖼</ToolBtn>

        {/* Blockquote */}
        <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">"</ToolBtn>

        {/* Code block */}
        <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">{`</>`}</ToolBtn>

        {/* Clear formatting */}
        <ToolBtn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="Clear formatting">✕</ToolBtn>
      </div>

      {/* ── Editor Area ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="tiptap-editor h-full">
          <EditorContent editor={editor} className="h-full" />
        </div>
      </div>
    </div>
  );
}
