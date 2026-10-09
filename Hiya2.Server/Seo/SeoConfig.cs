namespace Hiya2.Server.Seo
{
    /// <summary>
    /// Shape of wwwroot/seo/routes.json (source: hiya2.client/public/seo/routes.json), the single
    /// source of truth for per-route SEO shared by the React app and this server.
    /// </summary>
    public class SeoConfig
    {
        public string SiteUrl { get; set; } = "https://hiyaghar.com";
        public string SiteName { get; set; } = "HIYAGHAR";
        public string Locale { get; set; } = "en_IN";
        public string DefaultImage { get; set; } = "/image/og-default.jpg";
        public string FallbackImage { get; set; } = "/image/HIYA LOGO (1).png";
        public string ProductDescriptionTemplate { get; set; } = string.Empty;
        public SeoOrganization Organization { get; set; } = new();
        public List<SeoRoute> Routes { get; set; } = new();
        public List<SeoRoute> PrefixRoutes { get; set; } = new();
        public SeoRoute NotFound { get; set; } = new();
        public SeoRoute ProductNotFound { get; set; } = new();

        public SeoRoute? FindRoute(string path)
        {
            return Routes.FirstOrDefault(r => string.Equals(r.Path, path, StringComparison.OrdinalIgnoreCase))
                ?? PrefixRoutes.FirstOrDefault(r => !string.IsNullOrEmpty(r.Prefix)
                    && path.StartsWith(r.Prefix, StringComparison.OrdinalIgnoreCase));
        }
    }

    public class SeoOrganization
    {
        public string Name { get; set; } = string.Empty;
        public string Logo { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Telephone { get; set; } = string.Empty;
        public string AddressLocality { get; set; } = string.Empty;
        public string AddressRegion { get; set; } = string.Empty;
        public string AddressCountry { get; set; } = string.Empty;
        public List<string> SameAs { get; set; } = new();
    }

    public class SeoRoute
    {
        public string? Path { get; set; }
        public string? Prefix { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? H1 { get; set; }
        public string? Intro { get; set; }
        public string? Breadcrumb { get; set; }
        public string? LinkText { get; set; }
        public string? SchemaType { get; set; }
        public int? CategoryId { get; set; }
        public string? Collection { get; set; }
        public bool Noindex { get; set; }
        public bool Sitemap { get; set; }
        public bool HomeLinks { get; set; }
        public bool ContactDetails { get; set; }
    }
}
