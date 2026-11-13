using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.RegularExpressions;

namespace Hiya2.Server.Services.Gifting
{
    /// <summary>A piece of message text with its own formatting. Null style values mean "use the default".</summary>
    public class GiftMessageRun
    {
        public string Text { get; set; } = string.Empty;
        public bool IsLineBreak { get; set; }
        public string? FontKey { get; set; }
        public int? SizePx { get; set; }
        public string? Color { get; set; }
        public bool Bold { get; set; }
        public bool Italic { get; set; }
        public bool Underline { get; set; }
    }

    public class GiftMessageParagraph
    {
        public string? Align { get; set; }
        public List<GiftMessageRun> Runs { get; set; } = new();
    }

    public class GiftMessageDoc
    {
        public List<GiftMessageParagraph> Paragraphs { get; set; } = new();

        public string PlainText => string.Join("\n", Paragraphs.Select(p =>
            string.Concat(p.Runs.Select(r => r.IsLineBreak ? "\n" : r.Text))));

        public bool HasText => Paragraphs.Any(p => p.Runs.Any(r => !r.IsLineBreak && !string.IsNullOrWhiteSpace(r.Text)));
    }

    /// <summary>
    /// Reads the rich-text message the editor (TipTap) sends, keeping ONLY the supported pieces:
    /// paragraphs (with alignment), text, line breaks, and the bold / italic / underline / font /
    /// size / colour marks. Anything else - HTML, links, images, unknown fonts, bad colours - is
    /// dropped, so pasted or hand-crafted content can never reach the PDF or the admin screen.
    /// </summary>
    public static class GiftMessageSanitizer
    {
        private static readonly Regex HexColor = new("^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$", RegexOptions.Compiled);
        private static readonly Regex PxSize = new(@"^(\d{1,5}(\.\d+)?)px$", RegexOptions.Compiled);

        public static (GiftMessageDoc? Doc, string? Error) Parse(string? json)
        {
            if (string.IsNullOrWhiteSpace(json)) return (null, null);
            if (json.Length > 200_000) return (null, "Your message is too long.");

            JsonNode? root;
            try
            {
                root = JsonNode.Parse(json);
            }
            catch (JsonException)
            {
                return (null, "Your message could not be read. Please type it again.");
            }

            if (root is not JsonObject rootObj || (string?)rootObj["type"] != "doc")
            {
                return (null, "Your message could not be read. Please type it again.");
            }

            var doc = new GiftMessageDoc();
            if (rootObj["content"] is JsonArray blocks)
            {
                foreach (var block in blocks.OfType<JsonObject>())
                {
                    if ((string?)block["type"] != "paragraph") continue;
                    if (doc.Paragraphs.Count >= GiftSettings.MaxMessageParagraphs)
                    {
                        return (null, $"Your message can have at most {GiftSettings.MaxMessageParagraphs} lines.");
                    }

                    var paragraph = new GiftMessageParagraph
                    {
                        Align = NormaliseAlign(ReadString(block["attrs"], "textAlign")),
                    };

                    if (block["content"] is JsonArray inline)
                    {
                        foreach (var node in inline.OfType<JsonObject>())
                        {
                            var type = (string?)node["type"];
                            if (type == "hardBreak")
                            {
                                paragraph.Runs.Add(new GiftMessageRun { IsLineBreak = true });
                            }
                            else if (type == "text")
                            {
                                var text = CleanText((string?)node["text"]);
                                if (text.Length == 0) continue;
                                var run = new GiftMessageRun { Text = text };
                                ApplyMarks(run, node["marks"] as JsonArray);
                                paragraph.Runs.Add(run);
                            }
                        }
                    }
                    doc.Paragraphs.Add(paragraph);
                }
            }

            // Trim empty lines at the start and end - they only push the message off-centre.
            while (doc.Paragraphs.Count > 0 && IsBlank(doc.Paragraphs[0])) doc.Paragraphs.RemoveAt(0);
            while (doc.Paragraphs.Count > 0 && IsBlank(doc.Paragraphs[^1])) doc.Paragraphs.RemoveAt(doc.Paragraphs.Count - 1);

            if (!doc.HasText) return (null, null);

            var charCount = doc.PlainText.Replace("\n", "").Length;
            if (charCount > GiftSettings.MaxMessageChars)
            {
                return (null, $"Your message is too long ({charCount} characters). Please keep it under {GiftSettings.MaxMessageChars}.");
            }

            return (doc, null);
        }

        /// <summary>Writes the cleaned message back as editor JSON, so it reopens with the same formatting.</summary>
        public static string ToEditorJson(GiftMessageDoc doc)
        {
            var content = new JsonArray();
            foreach (var p in doc.Paragraphs)
            {
                var para = new JsonObject { ["type"] = "paragraph" };
                if (p.Align != null) para["attrs"] = new JsonObject { ["textAlign"] = p.Align };

                var inline = new JsonArray();
                foreach (var r in p.Runs)
                {
                    if (r.IsLineBreak)
                    {
                        inline.Add(new JsonObject { ["type"] = "hardBreak" });
                        continue;
                    }

                    var node = new JsonObject { ["type"] = "text", ["text"] = r.Text };
                    var marks = new JsonArray();
                    if (r.Bold) marks.Add(new JsonObject { ["type"] = "bold" });
                    if (r.Italic) marks.Add(new JsonObject { ["type"] = "italic" });
                    if (r.Underline) marks.Add(new JsonObject { ["type"] = "underline" });
                    if (r.FontKey != null || r.SizePx != null || r.Color != null)
                    {
                        var attrs = new JsonObject();
                        if (r.FontKey != null) attrs["fontFamily"] = r.FontKey;
                        if (r.SizePx != null) attrs["fontSize"] = $"{r.SizePx}px";
                        if (r.Color != null) attrs["color"] = r.Color;
                        marks.Add(new JsonObject { ["type"] = "textStyle", ["attrs"] = attrs });
                    }
                    if (marks.Count > 0) node["marks"] = marks;
                    inline.Add(node);
                }
                if (inline.Count > 0) para["content"] = inline;
                content.Add(para);
            }

            return new JsonObject { ["type"] = "doc", ["content"] = content }.ToJsonString();
        }

        private static void ApplyMarks(GiftMessageRun run, JsonArray? marks)
        {
            if (marks == null) return;
            foreach (var mark in marks.OfType<JsonObject>())
            {
                switch ((string?)mark["type"])
                {
                    case "bold": run.Bold = true; break;
                    case "italic": run.Italic = true; break;
                    case "underline": run.Underline = true; break;
                    case "textStyle":
                        var attrs = mark["attrs"];
                        run.FontKey = NormaliseFont(ReadString(attrs, "fontFamily"));
                        run.SizePx = NormaliseSize(ReadString(attrs, "fontSize"));
                        run.Color = NormaliseColor(ReadString(attrs, "color"));
                        break;
                }
            }
        }

        private static string? ReadString(JsonNode? obj, string key)
        {
            if (obj is not JsonObject o || o[key] is not JsonValue v) return null;
            return v.TryGetValue<string>(out var s) ? s : null;
        }

        private static string? NormaliseAlign(string? align)
        {
            var a = align?.Trim().ToLowerInvariant();
            return a != null && GiftSettings.Alignments.Contains(a) ? a : null;
        }

        private static string? NormaliseFont(string? key)
        {
            var k = key?.Trim().ToLowerInvariant();
            return k != null && GiftSettings.FontFamilies.ContainsKey(k) ? k : null;
        }

        private static int? NormaliseSize(string? size)
        {
            if (size == null) return null;
            var m = PxSize.Match(size.Trim().ToLowerInvariant());
            if (!m.Success || !double.TryParse(m.Groups[1].Value, System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out var px)) return null;
            return (int)Math.Clamp(Math.Round(px), GiftSettings.MinFontSizePx, GiftSettings.MaxFontSizePx);
        }

        private static string? NormaliseColor(string? color)
        {
            var c = color?.Trim();
            if (c == null || !HexColor.IsMatch(c)) return null;
            if (c.Length == 4) c = $"#{c[1]}{c[1]}{c[2]}{c[2]}{c[3]}{c[3]}";
            return c.ToUpperInvariant();
        }

        // Removes control characters (keeps normal text, emoji and Indian scripts).
        private static string CleanText(string? text)
        {
            if (string.IsNullOrEmpty(text)) return string.Empty;
            var sb = new StringBuilder(text.Length);
            foreach (var ch in text)
            {
                if (ch == '\t') sb.Append(' ');
                else if (!char.IsControl(ch)) sb.Append(ch);
            }
            return sb.ToString();
        }

        private static bool IsBlank(GiftMessageParagraph p) =>
            p.Runs.All(r => r.IsLineBreak || string.IsNullOrWhiteSpace(r.Text));
    }
}
