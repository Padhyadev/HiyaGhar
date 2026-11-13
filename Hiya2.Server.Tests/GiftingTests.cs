using System.Text;
using Hiya2.Server.Services.Gifting;

namespace Hiya2.Server.Tests;

public class GiftBoxPlannerTests
{
    // The starting (placeholder) boxes: Small = 2 units, Medium = 4, Large = 6.
    private static readonly GiftBoxType[] Boxes =
    {
        new(1, "Small Box", 2),
        new(2, "Medium Box", 4),
        new(3, "Large Box", 6),
    };

    [Fact]
    public void Two_small_bottles_fit_the_small_box()
    {
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Mukhwas 100g", 1, 2) }, Boxes);
        Assert.True(plan.IsSuccess);
        Assert.Equal(1, plan.BoxCount);
        Assert.Equal("Small Box", plan.Boxes[0].Name);
    }

    [Fact]
    public void Picks_the_smallest_box_that_fits_everything()
    {
        // 2 soaps (1 each) + 1 big bottle (2) = 4 units → one Medium box.
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Soap", 1, 2), new GiftPlanItem("Big bottle", 2, 1) }, Boxes);
        Assert.Equal(1, plan.BoxCount);
        Assert.Equal("1 × Medium Box", plan.Summary);
    }

    [Fact]
    public void Splits_into_several_boxes_when_the_largest_is_full()
    {
        // 8 units: one Large (6) + one Small (2).
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Soap", 1, 8) }, Boxes);
        Assert.Equal(2, plan.BoxCount);
        Assert.Equal("1 × Large Box, 1 × Small Box", plan.Summary);
        Assert.Equal(8, plan.TotalUnits);
    }

    [Fact]
    public void Big_items_are_never_split_across_boxes()
    {
        // Four big bottles (2 units each) = 8 units; each box holds whole bottles only.
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Big bottle", 2, 4) }, Boxes);
        Assert.Equal(2, plan.BoxCount);
        Assert.All(plan.Boxes, b => Assert.Equal(0, b.UsedUnits % 2));
    }

    [Fact]
    public void Zero_units_counts_as_one()
    {
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Unset", 0, 2) }, Boxes);
        Assert.Equal("1 × Small Box", plan.Summary);
    }

    [Fact]
    public void Item_bigger_than_every_box_is_an_error()
    {
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Hamper basket", 7, 1) }, Boxes);
        Assert.False(plan.IsSuccess);
        Assert.Contains("too large", plan.Error);
    }

    [Fact]
    public void No_boxes_configured_is_an_error()
    {
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Soap", 1, 1) }, Array.Empty<GiftBoxType>());
        Assert.False(plan.IsSuccess);
        Assert.Contains("not set up", plan.Error);
    }

    [Fact]
    public void Empty_selection_is_an_error()
    {
        var plan = GiftBoxPlanner.Plan(new[] { new GiftPlanItem("Soap", 1, 0) }, Boxes);
        Assert.False(plan.IsSuccess);
    }
}

public class GiftMessageSanitizerTests
{
    // "Happy Birthday Dhaval!" with three differently formatted words, as the editor sends it.
    private const string BirthdayJson = """
    {"type":"doc","content":[{"type":"paragraph","attrs":{"textAlign":"center"},"content":[
      {"type":"text","text":"Happy ","marks":[{"type":"bold"},{"type":"textStyle","attrs":{"color":"#ff0000","fontSize":"28px","fontFamily":"poppins"}}]},
      {"type":"text","text":"Birthday ","marks":[{"type":"bold"},{"type":"textStyle","attrs":{"color":"#000000","fontSize":"28px"}}]},
      {"type":"text","text":"Dhaval!","marks":[{"type":"italic"},{"type":"underline"},{"type":"textStyle","attrs":{"color":"#FFD700","fontSize":"32px","fontFamily":"playfair"}}]}
    ]}]}
    """;

    [Fact]
    public void Keeps_each_words_own_formatting()
    {
        var (doc, error) = GiftMessageSanitizer.Parse(BirthdayJson);
        Assert.Null(error);
        var runs = doc!.Paragraphs.Single().Runs;
        Assert.Equal(3, runs.Count);

        Assert.Equal(("#FF0000", 28, true, false), (runs[0].Color, runs[0].SizePx!.Value, runs[0].Bold, runs[0].Italic));
        Assert.Equal(("#000000", 28, true), (runs[1].Color, runs[1].SizePx!.Value, runs[1].Bold));
        Assert.Null(runs[1].FontKey); // no font chosen → default
        Assert.Equal(("#FFD700", 32, "playfair", true, true), (runs[2].Color, runs[2].SizePx!.Value, runs[2].FontKey, runs[2].Italic, runs[2].Underline));
        Assert.Equal("Happy Birthday Dhaval!", doc.PlainText);
    }

    [Fact]
    public void Round_trips_to_the_same_formatting()
    {
        var (doc, _) = GiftMessageSanitizer.Parse(BirthdayJson);
        var (again, error) = GiftMessageSanitizer.Parse(GiftMessageSanitizer.ToEditorJson(doc!));
        Assert.Null(error);
        Assert.Equal(GiftMessageSanitizer.ToEditorJson(doc!), GiftMessageSanitizer.ToEditorJson(again!));
    }

    [Fact]
    public void Drops_unsupported_content_and_bad_values()
    {
        const string json = """
        {"type":"doc","content":[
          {"type":"image","attrs":{"src":"http://evil/x.png"}},
          {"type":"paragraph","attrs":{"textAlign":"justify","onclick":"x"},"content":[
            {"type":"text","text":"Hi <script>alert(1)</script>","marks":[
              {"type":"link","attrs":{"href":"javascript:alert(1)"}},
              {"type":"textStyle","attrs":{"color":"red; background:url(x)","fontSize":"9999px","fontFamily":"Comic Sans"}}]}
          ]}]}
        """;
        var (doc, error) = GiftMessageSanitizer.Parse(json);
        Assert.Null(error);
        var p = doc!.Paragraphs.Single();
        Assert.Null(p.Align);                      // "justify" isn't offered
        var run = p.Runs.Single();
        Assert.Null(run.Color);                    // not a hex colour
        Assert.Null(run.FontKey);                  // not one of our fonts
        Assert.Equal(GiftSettings.MaxFontSizePx, run.SizePx); // clamped
        // Text stays as plain text (the PDF prints it literally; it is never rendered as HTML).
        Assert.Equal("Hi <script>alert(1)</script>", run.Text);
        Assert.DoesNotContain("link", GiftMessageSanitizer.ToEditorJson(doc));
    }

    [Theory]
    [InlineData("")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph"}]}""")]
    [InlineData("""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"   "}]}]}""")]
    public void Empty_message_means_no_message(string json)
    {
        var (doc, error) = GiftMessageSanitizer.Parse(json);
        Assert.Null(doc);
        Assert.Null(error);
    }

    [Fact]
    public void Rejects_malformed_and_overlong_messages()
    {
        Assert.NotNull(GiftMessageSanitizer.Parse("{not json").Error);
        Assert.NotNull(GiftMessageSanitizer.Parse("""{"type":"html"}""").Error);

        var longText = new string('a', GiftSettings.MaxMessageChars + 1);
        var json = $$"""{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"{{longText}}"}]}]}""";
        Assert.Contains("too long", GiftMessageSanitizer.Parse(json).Error);
    }

    [Fact]
    public void Expands_short_hex_colours()
    {
        const string json = """{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","marks":[{"type":"textStyle","attrs":{"color":"#0a0"}}]}]}]}""";
        Assert.Equal("#00AA00", GiftMessageSanitizer.Parse(json).Doc!.Paragraphs[0].Runs[0].Color);
    }
}

public class GiftInsertPdfTests
{
    // The fonts live in the server project, next to this test project.
    private static string FontDir([System.Runtime.CompilerServices.CallerFilePath] string thisFile = "") =>
        Path.Combine(Path.GetDirectoryName(thisFile)!, "..", "Hiya2.Server", "Assets", "GiftFonts");

    // 1×1 PNG.
    private static readonly byte[] Png = Convert.FromBase64String(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==");

    static GiftInsertPdfTests()
    {
        QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;
        QuestPDF.Settings.UseSystemFonts = false;
        QuestPDF.Settings.ThrowOnMissingTextGlyphs = false;
    }

    private static GiftMessageDoc Message() => GiftMessageSanitizer.Parse("""
        {"type":"doc","content":[{"type":"paragraph","content":[
          {"type":"text","text":"Happy ","marks":[{"type":"bold"},{"type":"textStyle","attrs":{"color":"#ff0000","fontSize":"28px","fontFamily":"poppins"}}]},
          {"type":"text","text":"Birthday ","marks":[{"type":"bold"},{"type":"textStyle","attrs":{"color":"#000000","fontSize":"28px","fontFamily":"times"}}]},
          {"type":"hardBreak"},
          {"type":"text","text":"Dhaval!","marks":[{"type":"italic"},{"type":"underline"},{"type":"textStyle","attrs":{"color":"#FFD700","fontSize":"32px","fontFamily":"dancing"}}]}
        ]},{"type":"paragraph","attrs":{"textAlign":"right"},"content":[{"type":"text","text":"— With love","marks":[{"type":"textStyle","attrs":{"fontFamily":"georgia"}}]}]}]}
        """).Doc!;

    [Theory]
    [InlineData(true, true)]
    [InlineData(true, false)]
    [InlineData(false, true)]
    public void Renders_a_one_page_A4_pdf_with_embedded_fonts(bool withPhoto, bool withMessage)
    {
        GiftInsertPdf.EnsureFonts(FontDir());
        var photoPath = Path.Combine(Path.GetTempPath(), $"gift-test-{Guid.NewGuid():N}.png");
        File.WriteAllBytes(photoPath, Png);
        try
        {
            var pdf = GiftInsertPdf.Render(withMessage ? Message() : null, withPhoto ? photoPath : null);
            var text = Encoding.Latin1.GetString(pdf);

            Assert.StartsWith("%PDF", text);
            Assert.Contains("/MediaBox [0 0 595", text);        // A4 width = 595.28 pt
            Assert.Equal(1, CountOccurrences(text, "/Type /Page\n") + CountOccurrences(text, "/Type /Page\r") + CountOccurrences(text, "/Type /Page "));
            if (withMessage)
            {
                Assert.Contains("FontFile2", text);              // TrueType fonts embedded
                Assert.Contains("Poppins", text);
                Assert.Contains("DancingScript", text);
            }
        }
        finally
        {
            File.Delete(photoPath);
        }
    }

    [Fact]
    public void Refuses_to_render_an_empty_insert()
    {
        Assert.Throws<InvalidOperationException>(() => GiftInsertPdf.Render(null, null));
    }

    private static int CountOccurrences(string text, string value)
    {
        var count = 0;
        for (var i = text.IndexOf(value, StringComparison.Ordinal); i >= 0; i = text.IndexOf(value, i + value.Length, StringComparison.Ordinal)) count++;
        return count;
    }
}
