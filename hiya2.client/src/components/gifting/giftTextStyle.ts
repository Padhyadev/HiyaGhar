import { Extension } from '@tiptap/core';
import {
  DEFAULT_ALIGN,
  matchFontKey,
  normaliseColor,
  normaliseFontSize,
  type GiftAlign,
} from './giftFonts';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    giftTextStyle: {
      setGiftFont: (fontKey: string) => ReturnType;
      setGiftFontSize: (px: number) => ReturnType;
      setGiftColor: (hex: string) => ReturnType;
      setGiftAlign: (align: GiftAlign) => ReturnType;
      /** Removes every formatting of the selected text (font, size, colour, bold, italic, underline). */
      clearGiftFormatting: () => ReturnType;
    };
  }
}

/**
 * Per-word formatting for the gift message, stored on the textStyle mark:
 *   fontFamily = one of our font keys (see giftFonts.ts), fontSize = "28px", color = "#RRGGBB"
 * and paragraph alignment. Pasted content is accepted only when it maps to these values,
 * everything else is dropped (the server cleans the message again - GiftMessageSanitizer).
 */
export const GiftTextStyle = Extension.create({
  name: 'giftTextStyle',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontFamily: {
            default: null,
            parseHTML: (el: HTMLElement) => el.getAttribute('data-gift-font') || matchFontKey(el.style.fontFamily),
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.fontFamily ? { 'data-gift-font': attrs.fontFamily } : {},
          },
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) => normaliseFontSize(el.style.fontSize),
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.fontSize ? { style: `font-size: ${attrs.fontSize}` } : {},
          },
          color: {
            default: null,
            parseHTML: (el: HTMLElement) => normaliseColor(el.style.color),
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.color ? { style: `color: ${attrs.color}` } : {},
          },
        },
      },
      {
        types: ['paragraph'],
        attributes: {
          textAlign: {
            default: null,
            parseHTML: (el: HTMLElement) => {
              const a = el.style.textAlign;
              return a === 'left' || a === 'center' || a === 'right' ? a : null;
            },
            renderHTML: (attrs: Record<string, unknown>) =>
              attrs.textAlign ? { style: `text-align: ${attrs.textAlign}` } : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setGiftFont:
        (fontKey) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontFamily: fontKey }).run(),
      setGiftFontSize:
        (px) =>
        ({ chain }) =>
          chain().setMark('textStyle', { fontSize: `${Math.round(px)}px` }).run(),
      setGiftColor:
        (hex) =>
        ({ chain }) =>
          chain().setMark('textStyle', { color: normaliseColor(hex) }).run(),
      setGiftAlign:
        (align) =>
        ({ commands }) =>
          commands.updateAttributes('paragraph', { textAlign: align === DEFAULT_ALIGN ? null : align }),
      clearGiftFormatting:
        () =>
        ({ chain }) =>
          chain().unsetMark('textStyle').unsetMark('bold').unsetMark('italic').unsetMark('underline').run(),
    };
  },
});
