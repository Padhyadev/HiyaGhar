using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerAddressController : ControllerBase
    {
        private readonly DataContext _context;

        public CustomerAddressController(DataContext context)
        {
            _context = context;
        }

        private long GetCurrentCustomerId()
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(claimSub, out var id)) return id;
            return 0;
        }

        /// <summary>
        /// Get all SHIPPING addresses for customer (ordered by IsDefault DESC, Id DESC).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAddresses([FromQuery] long? customerId)
        {
            long targetCustomerId = customerId > 0 ? customerId.Value : GetCurrentCustomerId();
            if (targetCustomerId <= 0)
            {
                return Ok(new List<CustomerAddress>());
            }

            var addresses = await _context.CustomerAddresses
                .AsNoTracking()
                .Where(a => a.CustomerId == targetCustomerId &&
                            !a.IsDeleted &&
                            a.IsActive &&
                            (a.AddressType == "SHIPPING" || string.IsNullOrEmpty(a.AddressType)))
                .OrderByDescending(a => a.IsDefault)
                .ThenByDescending(a => a.Id)
                .ToListAsync();

            return Ok(addresses);
        }

        /// <summary>
        /// Get the single permanent HOME address for customer.
        /// </summary>
        [HttpGet("home")]
        public async Task<IActionResult> GetHomeAddress([FromQuery] long? customerId)
        {
            long targetCustomerId = customerId > 0 ? customerId.Value : GetCurrentCustomerId();
            if (targetCustomerId <= 0)
            {
                return Ok(null);
            }

            var homeAddr = await _context.CustomerAddresses
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.CustomerId == targetCustomerId &&
                                          a.AddressType == "HOME" &&
                                          !a.IsDeleted &&
                                          a.IsActive);

            return Ok(homeAddr);
        }

        /// <summary>
        /// Save (Insert/Update) Customer Address.
        /// Strict Rule:
        /// - AddressType == "HOME": Exactly 1 record per customer (updates existing HOME record if present).
        /// - AddressType == "SHIPPING": Multiple delivery addresses permitted. First address gets IsDefault = 1.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> SaveAddress([FromBody] CustomerAddress address)
        {
            if (string.IsNullOrWhiteSpace(address.AddressLine1) || string.IsNullOrWhiteSpace(address.City) || string.IsNullOrWhiteSpace(address.PostalCode))
            {
                return BadRequest(new { isSuccess = false, message = "Address Line 1, City, and Postal Code are required." });
            }

            long targetCustomerId = address.CustomerId > 0 ? address.CustomerId : GetCurrentCustomerId();
            if (targetCustomerId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "Customer ID is required." });
            }

            address.CustomerId = targetCustomerId;
            string addrType = (address.AddressType ?? "SHIPPING").Trim().ToUpper();
            address.AddressType = addrType;

            // SCENARIO 1: HOME ADDRESS (ALWAYS SINGLE PERMANENT RECORD)
            if (addrType == "HOME")
            {
                var existingHome = await _context.CustomerAddresses
                    .FirstOrDefaultAsync(a => a.CustomerId == targetCustomerId && a.AddressType == "HOME" && !a.IsDeleted);

                if (existingHome != null)
                {
                    existingHome.CustomerName = address.CustomerName;
                    existingHome.AddressLine1 = address.AddressLine1;
                    existingHome.AddressLine2 = address.AddressLine2;
                    existingHome.City = address.City;
                    existingHome.State = address.State;
                    existingHome.PostalCode = address.PostalCode;
                    existingHome.Country = string.IsNullOrWhiteSpace(address.Country) ? "India" : address.Country;
                    existingHome.MobileNo = address.MobileNo;
                    existingHome.AlternativeMobileNo = address.AlternativeMobileNo;
                    existingHome.IsActive = true;
                    existingHome.LastModifiedDate = DateTime.Now;

                    _context.CustomerAddresses.Update(existingHome);
                    await _context.SaveChangesAsync();
                    return Ok(new { isSuccess = true, message = "Home address updated successfully.", address = existingHome });
                }
                else
                {
                    address.IsDefault = false;
                    address.IsActive = true;
                    address.IsDeleted = false;
                    address.CreatedDate = DateTime.Now;

                    await _context.CustomerAddresses.AddAsync(address);
                    await _context.SaveChangesAsync();
                    return Ok(new { isSuccess = true, message = "Home address saved successfully.", address });
                }
            }

            // SCENARIO 2: SHIPPING ADDRESS (MULTIPLE DELIVERY ADDRESSES PERMITTED)
            if (address.Id > 0)
            {
                var existing = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == address.Id && !a.IsDeleted);
                if (existing == null)
                {
                    return NotFound(new { isSuccess = false, message = "Shipping address not found." });
                }

                existing.CustomerName = address.CustomerName;
                existing.AddressLine1 = address.AddressLine1;
                existing.AddressLine2 = address.AddressLine2;
                existing.City = address.City;
                existing.State = address.State;
                existing.PostalCode = address.PostalCode;
                existing.Country = string.IsNullOrWhiteSpace(address.Country) ? "India" : address.Country;
                existing.MobileNo = address.MobileNo;
                existing.AlternativeMobileNo = address.AlternativeMobileNo;
                existing.AddressType = "SHIPPING";
                existing.LastModifiedDate = DateTime.Now;

                _context.CustomerAddresses.Update(existing);
                await _context.SaveChangesAsync();
                return Ok(new { isSuccess = true, message = "Shipping address updated successfully.", address = existing });
            }
            else
            {
                bool hasDefaultShipping = await _context.CustomerAddresses
                    .AnyAsync(a => a.CustomerId == targetCustomerId && a.AddressType == "SHIPPING" && a.IsDefault && !a.IsDeleted);

                address.IsDefault = !hasDefaultShipping;
                address.IsActive = true;
                address.IsDeleted = false;
                address.CreatedDate = DateTime.Now;

                await _context.CustomerAddresses.AddAsync(address);
                await _context.SaveChangesAsync();

                return Ok(new { isSuccess = true, message = "Shipping address saved successfully.", address });
            }
        }

        /// <summary>
        /// Set primary default shipping address.
        /// </summary>
        [HttpPut("{id}/set-default")]
        public async Task<IActionResult> SetDefaultAddress(long id, [FromQuery] long? customerId)
        {
            long targetCustomerId = customerId > 0 ? customerId.Value : GetCurrentCustomerId();
            if (targetCustomerId <= 0)
            {
                return BadRequest(new { isSuccess = false, message = "Customer ID is required." });
            }

            var shippingAddresses = await _context.CustomerAddresses
                .Where(a => a.CustomerId == targetCustomerId && (a.AddressType == "SHIPPING" || string.IsNullOrEmpty(a.AddressType)) && !a.IsDeleted)
                .ToListAsync();

            foreach (var addr in shippingAddresses)
            {
                addr.IsDefault = (addr.Id == id);
            }

            await _context.SaveChangesAsync();
            return Ok(new { isSuccess = true, message = "Primary default shipping address updated." });
        }

        /// <summary>
        /// Soft delete shipping address with automatic default promotion fallback.
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAddress(long id)
        {
            var addr = await _context.CustomerAddresses.FirstOrDefaultAsync(a => a.Id == id && !a.IsDeleted);
            if (addr == null)
            {
                return NotFound(new { isSuccess = false, message = "Address not found." });
            }

            bool wasDefault = addr.IsDefault;
            long custId = addr.CustomerId;

            addr.IsActive = false;
            addr.IsDeleted = true;
            addr.LastModifiedDate = DateTime.Now;

            _context.CustomerAddresses.Update(addr);
            await _context.SaveChangesAsync();

            // If deleted address was default, promote next shipping address as default
            if (wasDefault && addr.AddressType == "SHIPPING")
            {
                var nextDefault = await _context.CustomerAddresses
                    .Where(a => a.CustomerId == custId && a.AddressType == "SHIPPING" && !a.IsDeleted && a.IsActive)
                    .OrderByDescending(a => a.Id)
                    .FirstOrDefaultAsync();

                if (nextDefault != null)
                {
                    nextDefault.IsDefault = true;
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new { isSuccess = true, message = "Address deleted successfully." });
        }
    }
}
