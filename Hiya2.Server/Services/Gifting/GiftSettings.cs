namespace Hiya2.Server.Services.Gifting
{
    /// <summary>
    /// Fixed gifting rules. Kept in one place so the price, limits and fonts match everywhere.
    /// The client mirrors the font list and defaults in src/components/gifting/giftFonts.ts.
    /// </summary>
    public static class GiftSettings
    {
        /// <summary>Personalised gifting charge, per gift box (not per product).</summary>
        public const decimal PersonalisationChargePerBox = 100m;

        public const long MaxPhotoBytes = 10 * 1024 * 1024;

        public const int MaxMessageChars = 600;
        public const int MaxMessageParagraphs = 20;

        public const int MinFontSizePx = 10;
        public const int MaxFontSizePx = 96;

        // Defaults for text without its own formatting (must match the editor's CSS defaults).
        public const string DefaultFontKey = "poppins";
        public const int DefaultFontSizePx = 24;
        public const string DefaultColor = "#11223A";
        public const string DefaultAlign = "center";

        /// <summary>Font key (stored in the message JSON) → family name in the bundled TTF files.</summary>
        public static readonly IReadOnlyDictionary<string, string> FontFamilies = new Dictionary<string, string>
        {
            ["arial"] = "Arimo",
            ["poppins"] = "Poppins",
            ["georgia"] = "Gelasio",
            ["times"] = "Tinos",
            ["playfair"] = "Playfair Display",
            ["dancing"] = "Dancing Script",
        };

        public static readonly IReadOnlySet<string> Alignments = new HashSet<string> { "left", "center", "right" };

        // A4 insert layout in millimetres. The browser preview (GiftInsertPreview.tsx) uses the same numbers.
        public const float PageWidthMm = 210f;
        public const float PageHeightMm = 297f;
        public const float MarginMm = 15f;
        public const float UsableWidthMm = PageWidthMm - 2 * MarginMm;   // 180
        public const float UsableHeightMm = PageHeightMm - 2 * MarginMm; // 267
        /// <summary>Photo box = exactly 50% of the usable printable area (180 × 133.5 mm).</summary>
        public const float PhotoBoxHeightMm = UsableHeightMm / 2f;
        public const float GapMm = 8f;
        public const float MessageBoxHeightMm = UsableHeightMm - PhotoBoxHeightMm - GapMm;
    }
}
