using HIyaghar.Infra;
using Hiya2.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace Hiya2.Server.Services
{
    /// <summary>
    /// "Verified buyer" rules for product reviews. A customer may review a product, and a review counts
    /// as verified, only when that customer has a DELIVERED order containing the product. Customers are
    /// matched by email or mobile as well as by id, because guest checkout creates a separate customer
    /// row for the same person. Only verified reviews are sent to Google (Product aggregateRating).
    /// </summary>
    public static class ReviewVerification
    {
        /// <summary>The customer's own id plus every customer row with the same email or mobile.</summary>
        public static async Task<List<long>> LinkedCustomerIdsAsync(DataContext db, long customerId)
        {
            var me = await db.Customers.AsNoTracking()
                .Where(c => c.CustomerId == customerId)
                .Select(c => new { c.Email, c.MobileNo })
                .FirstOrDefaultAsync();
            if (me == null) return new List<long>();

            var email = (me.Email ?? "").Trim().ToLower();
            var mobile = (me.MobileNo ?? "").Trim();
            var ids = await db.Customers.AsNoTracking()
                .Where(c => c.CustomerId == customerId
                    || (email != "" && c.Email.ToLower() == email)
                    || (mobile != "" && c.MobileNo == mobile))
                .Select(c => c.CustomerId)
                .ToListAsync();
            if (!ids.Contains(customerId)) ids.Add(customerId);
            return ids;
        }

        public static Task<bool> HasDeliveredOrderAsync(DataContext db, IEnumerable<long> customerIds, int productId)
        {
            var ids = customerIds.ToList();
            return db.Orders.AsNoTracking().AnyAsync(o =>
                ids.Contains(o.CustomerId)
                && o.OrderStatus == OrderStatus.Delivered
                && o.Items.Any(i => i.ProductId == productId));
        }

        public static Task<bool> HasReviewedAsync(DataContext db, IEnumerable<long> customerIds, int productId)
        {
            var ids = customerIds.ToList();
            return db.Reviews.AsNoTracking().AnyAsync(r => ids.Contains(r.CustomerId) && r.ProductId == productId && !r.IsDeleted);
        }

        /// <summary>Ids of the given reviews whose writer (or a linked customer row) received the product.</summary>
        public static async Task<HashSet<long>> VerifiedReviewIdsAsync(DataContext db, IEnumerable<Review> reviews)
        {
            var verified = new HashSet<long>();
            var cache = new Dictionary<long, List<long>>();
            foreach (var r in reviews)
            {
                if (!cache.TryGetValue(r.CustomerId, out var linked))
                {
                    linked = await LinkedCustomerIdsAsync(db, r.CustomerId);
                    cache[r.CustomerId] = linked;
                }
                if (await HasDeliveredOrderAsync(db, linked, r.ProductId)) verified.Add(r.Id);
            }
            return verified;
        }

        /// <summary>Public name on a review: first name and last-name initial ("Neha J.").</summary>
        public static string DisplayName(Customer? customer)
        {
            if (customer == null) return "Anonymous";
            var lastInitial = !string.IsNullOrEmpty(customer.LastName) ? $"{customer.LastName[0]}." : string.Empty;
            return $"{customer.FirstName} {lastInitial}".Trim();
        }
    }
}
