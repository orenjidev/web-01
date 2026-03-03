"use client";

import { useRef, useCallback } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";

/* ── React NodeView ─────────────────────────────────────────────────────── */
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, title, width } = node.attrs as {
    src: string;
    alt?: string;
    title?: string;
    width?: number | null;
  };

  const imgRef = useRef<HTMLImageElement>(null);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      startX.current = e.clientX;
      startW.current = imgRef.current?.offsetWidth ?? (width ?? 0);

      const onMove = (mv: MouseEvent) => {
        const delta = mv.clientX - startX.current;
        const newWidth = Math.max(40, Math.round(startW.current + delta));
        updateAttributes({ width: newWidth });
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [width, updateAttributes]
  );

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: "inline-block", position: "relative", lineHeight: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={imgRef}
        src={src}
        alt={alt ?? ""}
        title={title ?? undefined}
        draggable={false}
        style={{
          width: width ? `${width}px` : undefined,
          maxWidth: "100%",
          borderRadius: "6px",
          margin: "0.5rem 0",
          display: "block",
          outline: selected ? "2px solid var(--primary)" : "none",
        }}
      />

      {/* Resize handle — bottom-right corner, only when selected */}
      {selected && (
        <span
          onMouseDown={onMouseDown}
          style={{
            position: "absolute",
            right: 0,
            bottom: 0,
            width: 12,
            height: 12,
            background: "var(--primary)",
            borderRadius: "2px 0 4px 0",
            cursor: "se-resize",
            zIndex: 10,
          }}
        />
      )}
    </NodeViewWrapper>
  );
}

/* ── Tiptap Extension ───────────────────────────────────────────────────── */
export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const w = el.getAttribute("width");
          return w ? Number(w) : null;
        },
        renderHTML: (attrs) =>
          attrs.width ? { width: String(attrs.width) } : {},
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  },
});
