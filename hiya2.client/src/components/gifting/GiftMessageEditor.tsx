import React, { useEffect, useId, useState } from 'react';
import { EditorContent, useEditor, useEditorState, type Editor, type JSONContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import { TextStyle } from '@tiptap/extension-text-style';
import { GiftTextStyle } from './giftTextStyle';
import {
  DEFAULT_ALIGN,
  DEFAULT_COLOR,
  DEFAULT_FONT_KEY,
  DEFAULT_FONT_SIZE_PX,
  GIFT_COLORS,
  GIFT_FONT_SIZES,
  GIFT_FONTS,
  MAX_FONT_SIZE_PX,
  MAX_MESSAGE_CHARS,
  MIN_FONT_SIZE_PX,
  normaliseColor,
  type GiftAlign,
} from './giftFonts';
import { messageLength } from './giftDraft';

// Rich-text gift message: customers select any word(s) and give them their own font, size,
// colour, bold / italic / underline - other words keep their formatting. Only these formats
// exist in the editor's schema, so pasted HTML, images, links etc. are dropped automatically.

interface FormatState {
  font: string;
  sizePx: number;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  align: GiftAlign;
  hasSelection: boolean;
  canUndo: boolean;
  canRedo: boolean;
}

function readFormat(editor: Editor | null): FormatState {
  const attrs = editor?.getAttributes('textStyle') ?? {};
  const para = editor?.getAttributes('paragraph') ?? {};
  const size = /^(\d+)px$/.exec(String(attrs.fontSize ?? ''));
  return {
    font: attrs.fontFamily || DEFAULT_FONT_KEY,
    sizePx: size ? Number(size[1]) : DEFAULT_FONT_SIZE_PX,
    color: normaliseColor(attrs.color) || DEFAULT_COLOR,
    bold: !!editor?.isActive('bold'),
    italic: !!editor?.isActive('italic'),
    underline: !!editor?.isActive('underline'),
    align: (para.textAlign as GiftAlign) || DEFAULT_ALIGN,
    hasSelection: !!editor && !editor.state.selection.empty,
    canUndo: !!editor?.can().undo(),
    canRedo: !!editor?.can().redo(),
  };
}

interface ToolbarProps {
  editor: Editor;
  format: FormatState;
  compact?: boolean;
}

const FormatToolbar: React.FC<ToolbarProps> = ({ editor, format, compact }) => {
  const id = useId();
  const [customSize, setCustomSize] = useState('');
  const [hex, setHex] = useState(format.color);
  useEffect(() => setHex(format.color), [format.color]);

  const isPreset = GIFT_FONT_SIZES.some((s) => s.px === format.sizePx);
  const run = (fn: (e: Editor) => void) => fn(editor);

  const applyCustomSize = () => {
    const px = Number(customSize);
    if (!Number.isFinite(px) || px <= 0) return;
    const clamped = Math.min(MAX_FONT_SIZE_PX, Math.max(MIN_FONT_SIZE_PX, Math.round(px)));
    editor.chain().focus().setGiftFontSize(clamped).run();
    setCustomSize('');
  };

  const applyHex = (value: string) => {
    const color = normaliseColor(value.startsWith('#') ? value : `#${value}`);
    if (color) editor.chain().focus().setGiftColor(color).run();
  };

  return (
    <div className={`gift-toolbar ${compact ? 'is-compact' : ''}`} role="toolbar" aria-label="Text formatting">
      <label className="gift-toolbar-field">
        <span className="sr-only">Font</span>
        <select
          value={format.font}
          onChange={(e) => editor.chain().focus().setGiftFont(e.target.value).run()}
          aria-label="Font"
          style={{ fontFamily: GIFT_FONTS.find((f) => f.key === format.font)?.css }}
        >
          {GIFT_FONTS.map((f) => (
            <option key={f.key} value={f.key} style={{ fontFamily: f.css }}>
              {f.label}
            </option>
          ))}
        </select>
      </label>

      <label className="gift-toolbar-field">
        <span className="sr-only">Font size</span>
        <select
          value={isPreset ? String(format.sizePx) : 'custom'}
          onChange={(e) => {
            if (e.target.value !== 'custom') editor.chain().focus().setGiftFontSize(Number(e.target.value)).run();
          }}
          aria-label="Font size"
        >
          {GIFT_FONT_SIZES.map((s) => (
            <option key={s.px} value={s.px}>
              {s.label} ({s.px}px)
            </option>
          ))}
          <option value="custom">{isPreset ? 'Custom…' : `Custom (${format.sizePx}px)`}</option>
        </select>
      </label>

      {!compact && (
        <span className="gift-toolbar-custom-size">
          <input
            type="number"
            inputMode="numeric"
            min={MIN_FONT_SIZE_PX}
            max={MAX_FONT_SIZE_PX}
            placeholder="px"
            value={customSize}
            onChange={(e) => setCustomSize(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyCustomSize();
              }
            }}
            aria-label={`Custom font size in pixels (${MIN_FONT_SIZE_PX} to ${MAX_FONT_SIZE_PX})`}
          />
          <button type="button" className="gift-tool-btn" onClick={applyCustomSize} disabled={!customSize}>
            Set
          </button>
        </span>
      )}

      <span className="gift-toolbar-divider" aria-hidden="true" />

      <div className="gift-toolbar-colors" role="group" aria-label="Text colour">
        {GIFT_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            className={`gift-color-swatch ${format.color === c.hex ? 'is-active' : ''}`}
            style={{ background: c.hex }}
            onClick={() => editor.chain().focus().setGiftColor(c.hex).run()}
            aria-label={c.label}
            aria-pressed={format.color === c.hex}
            title={c.label}
          />
        ))}
        <label className="gift-color-picker" title="Custom colour">
          <span className="sr-only">Custom colour</span>
          <input type="color" value={format.color.toLowerCase()} onChange={(e) => applyHex(e.target.value)} aria-label="Custom colour" />
        </label>
        {!compact && (
          <input
            id={`${id}-hex`}
            className="gift-hex-input"
            value={hex}
            maxLength={7}
            onChange={(e) => setHex(e.target.value)}
            onBlur={() => applyHex(hex)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                applyHex(hex);
              }
            }}
            aria-label="Colour HEX code"
            spellCheck={false}
          />
        )}
      </div>

      <span className="gift-toolbar-divider" aria-hidden="true" />

      <div className="gift-toolbar-group" role="group" aria-label="Text style">
        <button type="button" className={`gift-tool-btn ${format.bold ? 'is-active' : ''}`} aria-pressed={format.bold} aria-label="Bold" title="Bold (Ctrl+B)" onClick={() => run((e) => e.chain().focus().toggleBold().run())}>
          <i className="fa-solid fa-bold" aria-hidden="true" />
        </button>
        <button type="button" className={`gift-tool-btn ${format.italic ? 'is-active' : ''}`} aria-pressed={format.italic} aria-label="Italic" title="Italic (Ctrl+I)" onClick={() => run((e) => e.chain().focus().toggleItalic().run())}>
          <i className="fa-solid fa-italic" aria-hidden="true" />
        </button>
        <button type="button" className={`gift-tool-btn ${format.underline ? 'is-active' : ''}`} aria-pressed={format.underline} aria-label="Underline" title="Underline (Ctrl+U)" onClick={() => run((e) => e.chain().focus().toggleUnderline().run())}>
          <i className="fa-solid fa-underline" aria-hidden="true" />
        </button>
      </div>

      {!compact && (
        <>
          <span className="gift-toolbar-divider" aria-hidden="true" />
          <div className="gift-toolbar-group" role="group" aria-label="Alignment">
            {(['left', 'center', 'right'] as GiftAlign[]).map((a) => (
              <button
                key={a}
                type="button"
                className={`gift-tool-btn ${format.align === a ? 'is-active' : ''}`}
                aria-pressed={format.align === a}
                aria-label={`Align ${a === 'center' ? 'centre' : a}`}
                title={`Align ${a === 'center' ? 'centre' : a}`}
                onClick={() => editor.chain().focus().setGiftAlign(a).run()}
              >
                <i className={`fa-solid fa-align-${a}`} aria-hidden="true" />
              </button>
            ))}
          </div>
          <span className="gift-toolbar-divider" aria-hidden="true" />
          <div className="gift-toolbar-group" role="group" aria-label="Edit">
            <button type="button" className="gift-tool-btn" aria-label="Undo" title="Undo" disabled={!format.canUndo} onClick={() => editor.chain().focus().undo().run()}>
              <i className="fa-solid fa-rotate-left" aria-hidden="true" />
            </button>
            <button type="button" className="gift-tool-btn" aria-label="Redo" title="Redo" disabled={!format.canRedo} onClick={() => editor.chain().focus().redo().run()}>
              <i className="fa-solid fa-rotate-right" aria-hidden="true" />
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        className="gift-tool-btn gift-tool-text-btn"
        onClick={() => editor.chain().focus().clearGiftFormatting().run()}
        title="Remove formatting from the selected text"
      >
        <i className="fa-solid fa-text-slash" aria-hidden="true" /> {compact ? '' : 'Reset style'}
        {compact && <span className="sr-only">Reset style</span>}
      </button>
    </div>
  );
};

interface GiftMessageEditorProps {
  value: JSONContent | null;
  onChange: (value: JSONContent | null) => void;
}

export const GiftMessageEditor: React.FC<GiftMessageEditorProps> = ({ value, onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        bulletList: false,
        code: false,
        codeBlock: false,
        heading: false,
        horizontalRule: false,
        listItem: false,
        listKeymap: false,
        orderedList: false,
        strike: false,
        link: false,
        dropcursor: false,
        trailingNode: false,
      }),
      TextStyle,
      GiftTextStyle,
    ],
    content: value ?? '',
    editorProps: {
      attributes: {
        class: 'gift-editor-content',
        'aria-label': 'Your personal message',
        'aria-multiline': 'true',
        role: 'textbox',
      },
      // Pasted text keeps supported formatting; images and other media are removed first.
      transformPastedHTML: (html) => html.replace(/<(img|video|audio|iframe|object|embed|svg|picture|source)[^>]*>/gi, ''),
    },
    onUpdate: ({ editor: e }) => {
      onChange(e.isEmpty ? null : e.getJSON());
    },
  });

  const format = useEditorState({ editor, selector: (ctx) => readFormat(ctx.editor) }) ?? readFormat(null);
  const length = messageLength(value);
  const tooLong = length > MAX_MESSAGE_CHARS;

  if (!editor) return null;

  return (
    <div className="gift-editor">
      <FormatToolbar editor={editor} format={format} />
      <BubbleMenu
        editor={editor}
        // Below the selection, so it never covers the main toolbar above the editor.
        options={{ placement: 'bottom', offset: 8, flip: false, shift: { padding: 8 } }}
        shouldShow={({ editor: e, state }) => e.isEditable && !state.selection.empty}
        className="gift-bubble-menu"
      >
        <FormatToolbar editor={editor} format={format} compact />
      </BubbleMenu>
      <EditorContent editor={editor} className="gift-editor-surface" />
      <div className="gift-editor-footer">
        <span className="gift-editor-hint">
          <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" /> Select any word to change only that word's font, size or colour.
        </span>
        <span className={`gift-editor-count ${tooLong ? 'is-over' : ''}`} aria-live="polite">
          {length}/{MAX_MESSAGE_CHARS}
        </span>
      </div>
      {tooLong && (
        <p className="gift-field-error" role="alert">
          Your message is too long. Please keep it under {MAX_MESSAGE_CHARS} characters.
        </p>
      )}
    </div>
  );
};
