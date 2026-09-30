using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Customer
{
    public interface ICustomerRepository
    {
        Task<IEnumerable<Models.Customer>> GetAllAsync();
        Task<Models.Customer?> GetByIdAsync(long id);
        Task<Models.Customer> AddAsync(Models.Customer customer);
        Task<bool> UpdateAsync(Models.Customer customer);
        Task<bool> DeleteAsync(long id);
    }
}
