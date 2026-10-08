using Hiya2.Server.Models;

namespace Hiya2.Server.Services
{
    public interface ICustomerAuthService
    {
        string GenerateCustomerToken(Customer customer);
        string HashPassword(string password);
        bool VerifyPassword(string inputPassword, string storedHash);
    }
}
