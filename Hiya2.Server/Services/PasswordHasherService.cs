using Microsoft.AspNetCore.Identity;

namespace Hiya2.Server.Services
{
    public static class PasswordHasherService
    {
        private static readonly PasswordHasher<object> Hasher = new();

        public static string Hash(string password)
        {
            return Hasher.HashPassword(null!, password);
        }

        public static bool Verify(string providedPassword, string storedHash)
        {
            if (string.IsNullOrEmpty(storedHash))
            {
                return false;
            }

            try
            {
                var result = Hasher.VerifyHashedPassword(null!, storedHash, providedPassword);
                if (result == PasswordVerificationResult.Success || result == PasswordVerificationResult.SuccessRehashNeeded)
                {
                    return true;
                }
            }
            catch (FormatException)
            {
                // Not a hash produced by PasswordHasher (e.g. a pre-migration plaintext value) — fall through.
            }

            // Legacy fallback for accounts created before real hashing was added.
            return storedHash == providedPassword;
        }

        public static bool NeedsRehash(string storedHash)
        {
            if (string.IsNullOrEmpty(storedHash))
            {
                return true;
            }

            try
            {
                var bytes = Convert.FromBase64String(storedHash);
                return bytes.Length == 0 || bytes[0] != 0x01;
            }
            catch (FormatException)
            {
                return true;
            }
        }
    }
}
