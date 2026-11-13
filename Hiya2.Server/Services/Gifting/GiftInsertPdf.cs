using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Hiya2.Server.Services.Gifting
{
    /// <summary>
    /// Builds the A4 portrait (210 × 297 mm) print insert for a personalised gift:
    /// the photo (if any) centred in a box that is exactly 50% of the printable area, never
    /// stretched, and the message (if any) below it with each word's own font, size, colour
    /// and bold / italic / underline. Fonts are embedded from Assets/GiftFonts.
    /// The browser preview (GiftInsertPreview.tsx) uses the same layout numbers.
    /// </summary>
    public static class GiftInsertPdf
    {
        private static readonly object FontLock = new();
        private static bool _fontsRegistered;

        // CSS px (1/96 in) → PDF points (1/72 in). The editor sizes text in px.
        private const float PxToPt = 0.75f;

        public static void EnsureFonts(string fontDirectory)
        {
            if (_fontsRegistered) return;
            lock (FontLock)
            {
                if (_fontsRegistered) return;
                if (Directory.Exists(fontDirectory))
                {
                    foreach (var file in Directory.GetFiles(fontDirectory, "*.ttf"))
                    {
                        FontManager.RegisterFontFromFile(file);
                    }
                }
                _fontsRegistered = true;
            }
        }

        public static byte[] Render(GiftMessageDoc? message, string? photoPath)
        {
            var hasMessage = message is { HasText: true };
            var hasPhoto = !string.IsNullOrEmpty(photoPath);
            if (!hasMessage && !hasPhoto)
            {
                throw new InvalidOperationException("Nothing to print: the gift has no photo and no message.");
            }

            var photoBytes = hasPhoto ? File.ReadAllBytes(photoPath!) : null;

            return Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(GiftSettings.MarginMm, Unit.Millimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(DefaultStyle);

                    page.Content().Element(content =>
                    {
                        if (hasPhoto && hasMessage)
                        {
                            content.Column(col =>
                            {
                                col.Item().Height(GiftSettings.PhotoBoxHeightMm, Unit.Millimetre).Element(c => Photo(c, photoBytes!));
                                col.Item().Height(GiftSettings.GapMm, Unit.Millimetre);
                                col.Item().Height(GiftSettings.MessageBoxHeightMm, Unit.Millimetre).Element(c => Message(c, message!));
                            });
                        }
                        else if (hasPhoto)
                        {
                            content.AlignMiddle().Height(GiftSettings.PhotoBoxHeightMm, Unit.Millimetre).Element(c => Photo(c, photoBytes!));
                        }
                        else
                        {
                            Message(content, message!);
                        }
                    });
                });
            }).GeneratePdf();
        }

        private static TextStyle DefaultStyle(TextStyle style) => style
            .FontFamily(GiftSettings.FontFamilies[GiftSettings.DefaultFontKey], "Arimo")
            .FontSize(GiftSettings.DefaultFontSizePx * PxToPt)
            .FontColor(GiftSettings.DefaultColor);

        // FitArea keeps the photo's own aspect ratio inside the box; 300 DPI is the print resolution.
        private static void Photo(IContainer container, byte[] photo) => container
            .AlignCenter()
            .AlignMiddle()
            .Image(photo)
            .FitArea()
            .WithRasterDpi(300)
            .WithCompressionQuality(ImageCompressionQuality.Best);

        // ScaleToFit only shrinks a message that is too big for its area; it is centred vertically.
        private static void Message(IContainer container, GiftMessageDoc message) => container
            .AlignMiddle()
            .ScaleToFit()
            .Column(col =>
            {
                foreach (var paragraph in message.Paragraphs)
                {
                    col.Item().Element(c => Paragraph(c, paragraph));
                }
            });

        private static void Paragraph(IContainer container, GiftMessageParagraph paragraph)
        {
            container.Text(text =>
            {
                switch (paragraph.Align ?? GiftSettings.DefaultAlign)
                {
                    case "left": text.AlignLeft(); break;
                    case "right": text.AlignRight(); break;
                    default: text.AlignCenter(); break;
                }

                var visible = paragraph.Runs.Where(r => r.IsLineBreak || r.Text.Length > 0).ToList();
                if (visible.Count == 0)
                {
                    // Empty line: keeps the line height of the default text, like the editor does.
                    text.Span(" ");
                    return;
                }

                GiftMessageRun? previous = null;
                foreach (var run in visible)
                {
                    // A line break takes the style of the text before it so the line height matches.
                    var styleSource = run.IsLineBreak ? (previous ?? run) : run;
                    var span = text.Span(run.IsLineBreak ? "\n" : run.Text);
                    var fontKey = styleSource.FontKey ?? GiftSettings.DefaultFontKey;
                    span.FontFamily(GiftSettings.FontFamilies[fontKey], "Arimo")
                        .FontSize((styleSource.SizePx ?? GiftSettings.DefaultFontSizePx) * PxToPt)
                        .FontColor(styleSource.Color ?? GiftSettings.DefaultColor);
                    if (styleSource.Bold) span.Bold();
                    if (styleSource.Italic) span.Italic();
                    if (!run.IsLineBreak && run.Underline) span.Underline();
                    if (!run.IsLineBreak) previous = run;
                }
            });
        }
    }
}
