using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Hiya2.Server.Models;
using Hiya2.Server.Repositories.Customer;

namespace Hiya2.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerRepository _customerRepository;

        public CustomerController(ICustomerRepository customerRepository)
        {
            _customerRepository = customerRepository;
        }

        private long GetCurrentUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return long.TryParse(claim, out var id) ? id : 0;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var customers = await _customerRepository.GetAllAsync();
            return Ok(customers);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id)
        {
            var customer = await _customerRepository.GetByIdAsync(id);
            if (customer == null)
            {
                return NotFound(new { message = $"Customer with Id {id} not found." });
            }
            return Ok(customer);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Customer customer)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            customer.CreatedBy = GetCurrentUserId();

            var createdCustomer = await _customerRepository.AddAsync(customer);
            return CreatedAtAction(nameof(GetById), new { id = createdCustomer.CustomerId }, createdCustomer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] Customer customer)
        {
            if (id != customer.CustomerId)
            {
                return BadRequest(new { message = "Id in route parameter does not match CustomerId in request body." });
            }

            customer.LastModifiedBy = GetCurrentUserId();

            var success = await _customerRepository.UpdateAsync(customer);
            if (!success)
            {
                return NotFound(new { message = $"Customer with Id {id} not found." });
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id)
        {
            var success = await _customerRepository.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Customer with Id {id} not found." });
            }

            return NoContent();
        }
    }
}
