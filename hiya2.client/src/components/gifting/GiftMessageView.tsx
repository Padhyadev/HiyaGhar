import React from 'react';
import type { JSONContent } from '@tiptap/react';
import { DEFAULT_ALIGN, DEFAULT_COLOR, DEFAULT_FONT_SIZE_PX, fontByKey, normaliseColor } from './giftFonts';

// Renders the saved message (editor JSON) as plain React elements - never as raw HTML - with
// each word's own font, size, colour and styles. Used by the A4 preview and the admin order view.

const ALIGNS = new Set(['left', 'center', 'right']);

function textStyle(node: JSONContent): React.CSSProperties {
  const style: React.CSSProperties = {};
  const decorations: string[] = [];
  for (const mark of node.marks ?? []) {
    if (mark.type === 'bold') style.fontWeight = 700;
    else if (mark.type === 'italic') style.fontStyle = 'italic';
    else if (mark.type === 'underline') decorations.push('underline');
    else if (mark.type === 'textStyle') {
      const attrs = mark.attrs ?? {};
      if (attrs.fontFamily) style.fontFamily = fontByKey(String(attrs.fontFamily)).css;
      const size = /^(\d{1,3})px$/.exec(String(attrs.fontSize ?? ''));
      if (size) style.fontSize = `${size[1]}px`;
      const color = normaliseColor(attrs.color ? String(attrs.color) : null);
      if (color) style.color = color;
    }
  }
  if (decorations.length) style.textDecoration = decorations.join(' ');
  return style;
}

interface GiftMessageViewProps {
  message: JSONContent | null;
  className?: string;
}

export const GiftMessageView: React.FC<GiftMessageViewProps> = ({ message, className }) => {
  const paragraphs = (message?.content ?? []).filter((p) => p.type === 'paragraph');
  return (
    <div
      className={className}
      style={{
        fontFamily: fontByKey(null).css,
        fontSize: `${DEFAULT_FONT_SIZE_PX}px`,
        color: DEFAULT_COLOR,
        lineHeight: 'normal',
      }}
    >
      {paragraphs.map((p, i) => {
        const align = ALIGNS.has(String(p.attrs?.textAlign)) ? String(p.attrs?.textAlign) : DEFAULT_ALIGN;
        const inline = p.content ?? [];
        return (
          <p key={i} style={{ margin: 0, textAlign: align as React.CSSProperties['textAlign'], whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            {inline.length === 0 ? (
              <br />
            ) : (
              inline.map((node, j) =>
                node.type === 'hardBreak' ? (
                  <br key={j} />
                ) : node.type === 'text' ? (
                  <span key={j} style={textStyle(node)}>
                    {node.text}
                  </span>
                ) : null,
              )
            )}
          </p>
        );
      })}
    </div>
  );
};
