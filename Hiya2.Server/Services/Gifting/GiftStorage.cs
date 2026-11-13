using System.Text.RegularExpressions;

namespace Hiya2.Server.Services.Gifting
{
    public enum GiftImageKind { Jpeg, Png, Webp }

    /// <summary>
    /// Private storage for customers' gift photos and the generated A4 inserts.
    /// Files live OUTSIDE wwwroot (default: {ContentRoot}/App_Data/gift-files, or the
    /// "GiftStorage:Root" setting), so they are never served as static files - only through
    /// the staff-only download endpoints in GiftController.
    ///
    ///   pending/{customerId}/{token}/original.{ext} + photo.{ext}   uploaded before the order exists
    ///   orders/{orderNumber}/photo-original.{ext}, photo.{ext}, insert.pdf
    /// </summary>
    public class GiftStorage
    {
        private static readonly Regex TokenFormat = new("^[0-9a-f]{32}$", RegexOptions.Compiled);
        private static readonly Regex SafeName = new("[^A-Za-z0-9_-]", RegexOptions.Compiled);
        private static readonly TimeSpan PendingLifetime = TimeSpan.FromDays(2);

        public string Root { get; }

        public GiftStorage(IConfiguration configuration, IWebHostEnvironment env)
        {
            var configured = configuration["GiftStorage:Root"];
            Root = Path.GetFullPath(string.IsNullOrWhiteSpace(configured)
                ? Path.Combine(env.ContentRootPath, "App_Data", "gift-files")
                : configured);
        }

        public static GiftImageKind? DetectImage(ReadOnlySpan<byte> header)
        {
            if (header.Length >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF) return GiftImageKind.Jpeg;
            if (header.Length >= 8 && header[0] == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47
                && header[4] == 0x0D && header[5] == 0x0A && header[6] == 0x1A && header[7] == 0x0A) return GiftImageKind.Png;
            if (header.Length >= 12 && header[0] == 'R' && header[1] == 'I' && header[2] == 'F' && header[3] == 'F'
                && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P') return GiftImageKind.Webp;
            return null;
        }

        public static string Extension(GiftImageKind kind) => kind switch
        {
            GiftImageKind.Jpeg => ".jpg",
            GiftImageKind.Png => ".png",
            _ => ".webp",
        };

        public static string ContentType(string path) => Path.GetExtension(path).ToLowerInvariant() switch
        {
            ".jpg" or ".jpeg" => "image/jpeg",
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream",
        };

        /// <summary>Saves an uploaded photo (original + cropped) for a customer and returns its token.</summary>
        public async Task<string> SavePendingPhotoAsync(long customerId, byte[] original, GiftImageKind originalKind, byte[] cropped, GiftImageKind croppedKind)
        {
            CleanUpOldPending();

            var token = Guid.NewGuid().ToString("N");
            var dir = PendingDir(customerId, token);
            Directory.CreateDirectory(dir);
            await File.WriteAllBytesAsync(Path.Combine(dir, "original" + Extension(originalKind)), original);
            await File.WriteAllBytesAsync(Path.Combine(dir, "photo" + Extension(croppedKind)), cropped);
            return token;
        }

        /// <summary>The customer's pending photo files, or null when the token is unknown or belongs to someone else.</summary>
        public (string Original, string Cropped)? FindPendingPhoto(long customerId, string? token)
        {
            if (string.IsNullOrWhiteSpace(token) || !TokenFormat.IsMatch(token)) return null;
            var dir = PendingDir(customerId, token);
            if (!Directory.Exists(dir)) return null;
            var original = Directory.GetFiles(dir, "original.*").FirstOrDefault();
            var cropped = Directory.GetFiles(dir, "photo.*").FirstOrDefault();
            return original != null && cropped != null ? (original, cropped) : null;
        }

        /// <summary>Copies a pending photo into the order's folder; returns the stored relative paths.</summary>
        public (string OriginalPath, string PhotoPath) CopyPhotoToOrder(string orderNumber, (string Original, string Cropped) pending)
        {
            var dir = OrderDir(orderNumber);
            Directory.CreateDirectory(dir);
            var original = Path.Combine(dir, "photo-original" + Path.GetExtension(pending.Original));
            var photo = Path.Combine(dir, "photo" + Path.GetExtension(pending.Cropped));
            File.Copy(pending.Original, original, overwrite: true);
            File.Copy(pending.Cropped, photo, overwrite: true);
            return (ToRelative(original), ToRelative(photo));
        }

        public void DeletePending(long customerId, string? token)
        {
            if (string.IsNullOrWhiteSpace(token) || !TokenFormat.IsMatch(token)) return;
            try
            {
                var dir = PendingDir(customerId, token);
                if (Directory.Exists(dir)) Directory.Delete(dir, recursive: true);
            }
            catch (IOException) { /* cleaned up later by CleanUpOldPending */ }
        }

        public async Task<string> SaveInsertPdfAsync(string orderNumber, byte[] pdf)
        {
            var dir = OrderDir(orderNumber);
            Directory.CreateDirectory(dir);
            var path = Path.Combine(dir, "insert.pdf");
            await File.WriteAllBytesAsync(path, pdf);
            return ToRelative(path);
        }

        /// <summary>Absolute path for a stored relative path, or null if it is missing or points outside the storage folder.</summary>
        public string? Resolve(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath)) return null;
            var full = Path.GetFullPath(Path.Combine(Root, relativePath));
            if (!full.StartsWith(Root + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)) return null;
            return File.Exists(full) ? full : null;
        }

        private string PendingDir(long customerId, string token) =>
            Path.Combine(Root, "pending", customerId.ToString(), token);

        private string OrderDir(string orderNumber) =>
            Path.Combine(Root, "orders", SafeName.Replace(orderNumber, "_"));

        private string ToRelative(string fullPath) => Path.GetRelativePath(Root, fullPath).Replace('\\', '/');

        // Photos uploaded for gifts that were never ordered are removed after two days.
        private void CleanUpOldPending()
        {
            try
            {
                var pendingRoot = Path.Combine(Root, "pending");
                if (!Directory.Exists(pendingRoot)) return;
                var cutoff = DateTime.UtcNow - PendingLifetime;
                foreach (var dir in Directory.GetDirectories(pendingRoot).SelectMany(Directory.GetDirectories))
                {
                    if (Directory.GetCreationTimeUtc(dir) < cutoff) Directory.Delete(dir, recursive: true);
                }
            }
            catch (IOException) { }
            catch (UnauthorizedAccessException) { }
        }
    }
}
