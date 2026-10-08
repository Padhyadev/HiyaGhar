using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Repositories.Customer
{
    public class CustomerRepository : ICustomerRepository
    {
        private readonly DataContext _context;

        public CustomerRepository(DataContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Models.Customer>> GetAllAsync()
        {
            return await _context.Customers
                .Where(c => !c.IsDeleted)
                .ToListAsync();
        }

        public async Task<Models.Customer?> GetByIdAsync(long id)
        {
            return await _context.Customers
                .FirstOrDefaultAsync(c => c.CustomerId == id && !c.IsDeleted);
        }

        public async Task<Models.Customer> AddAsync(Models.Customer customer)
        {
            customer.CreatedDate = DateTime.UtcNow;
            customer.IsDeleted = false;
            await _context.Customers.AddAsync(customer);
            await _context.SaveChangesAsync();
            return customer;
        }

        public async Task<bool> UpdateAsync(Models.Customer customer)
        {
            var existing = await _context.Customers.FindAsync(customer.CustomerId);
            if (existing == null || existing.IsDeleted)
            {
                return false;
            }

            existing.FirstName = customer.FirstName;
            existing.LastName = customer.LastName;
            existing.Email = customer.Email;
            existing.MobileNo = customer.MobileNo;
            if (!string.IsNullOrWhiteSpace(customer.PasswordHash))
            {
                existing.PasswordHash = customer.PasswordHash;
            }
            existing.IsActive = customer.IsActive;
            existing.LastModifiedBy = customer.LastModifiedBy;
            existing.LastModifiedDate = DateTime.UtcNow;

            _context.Customers.Update(existing);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null || customer.IsDeleted)
            {
                return false;
            }

            // Soft delete as per IsDeleted schema flag
            customer.IsActive = false;
            customer.IsDeleted = true;
            customer.LastModifiedDate = DateTime.UtcNow;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
