using System.Text.Json;
using Microsoft.Extensions.FileProviders;

namespace Hiya2.Server.Seo
{
    /// <summary>
    /// Holds the built index.html and seo/routes.json from the web root. Both are read once and
    /// re-read only when the file's timestamp changes (i.e. after a new publish).
    /// </summary>
    public class SeoContentStore
    {
        private readonly IFileProvider _files;
        private readonly ILogger<SeoContentStore> _logger;
        private readonly object _lock = new();
        private Snapshot? _snapshot;
        private bool _warnedNoMarkers;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            ReadCommentHandling = JsonCommentHandling.Skip,
        };

        public SeoContentStore(IWebHostEnvironment env, ILogger<SeoContentStore> logger)
        {
            _files = env.WebRootFileProvider;
            _logger = logger;
        }

        public record Snapshot(SeoConfig Config, string? IndexHtml, DateTimeOffset IndexLastModified, string DefaultImage, string Version);

        public Snapshot Get()
        {
            var index = _files.GetFileInfo("index.html");
            var routes = _files.GetFileInfo("seo/routes.json");
            var version = $"{(index.Exists ? index.LastModified.UtcTicks : 0)}-{(routes.Exists ? routes.LastModified.UtcTicks : 0)}";

            var current = _snapshot;
            if (current != null && current.Version == version) return current;

            lock (_lock)
            {
                if (_snapshot != null && _snapshot.Version == version) return _snapshot;

                var config = new SeoConfig();
                if (routes.Exists)
                {
                    using var stream = routes.CreateReadStream();
                    config = JsonSerializer.Deserialize<SeoConfig>(stream, JsonOptions) ?? new SeoConfig();
                }
                else
                {
                    _logger.LogWarning("SEO: seo/routes.json not found in the web root; only default tags are available.");
                }

                string? html = null;
                if (index.Exists)
                {
                    using var reader = new StreamReader(index.CreateReadStream());
                    html = reader.ReadToEnd();
                    if (!html.Contains(SeoMarkup.HeadStart) && !_warnedNoMarkers)
                    {
                        _warnedNoMarkers = true;
                        _logger.LogWarning("SEO: index.html has no <!--SEO_HEAD--> marker (dev web root?); pages are served without server-side SEO tags.");
                    }
                }

                // Default share image: og-default.jpg once it has been added, otherwise the logo
                // (the client makes the same decision at build time, see vite.config.ts).
                var defaultImage = _files.GetFileInfo(config.DefaultImage.TrimStart('/')).Exists
                    ? config.DefaultImage
                    : config.FallbackImage;

                _snapshot = new Snapshot(config, html, index.Exists ? index.LastModified : DateTimeOffset.UtcNow, defaultImage, version);
                return _snapshot;
            }
        }
    }
}
