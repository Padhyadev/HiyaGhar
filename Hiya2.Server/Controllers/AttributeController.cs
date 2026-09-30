using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;

namespace Hiya2.Server.Controllers
{
    public class AttributeSaveDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? DisplayName { get; set; }
        public bool? IsActive { get; set; } = true;
        public List<AttributeValueSaveDto> Values { get; set; } = new();
    }

    public class AttributeValueSaveDto
    {
        public int Id { get; set; }
        public string Value { get; set; } = string.Empty;
        public bool? IsActive { get; set; } = true;
    }

    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AttributeController : ControllerBase
    {
        private readonly DataContext _context;

        public AttributeController(DataContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var attributes = await _context.Attributes
                .Include(a => a.AttributeValues)
                .Where(a => a.IsDeleted == false || a.IsDeleted == null)
                .Select(a => new
                {
                    a.Id,
                    a.Name,
                    a.DisplayName,
                    a.IsActive,
                    a.CreatedDate,
                    values = a.AttributeValues
                        .Where(v => v.IsDeleted == false || v.IsDeleted == null)
                        .Select(v => new
                        {
                            v.Id,
                            v.AttributeId,
                            v.Value,
                            v.IsActive
                        }).ToList()
                })
                .ToListAsync();

            return Ok(attributes);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AttributeSaveDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
            {
                return BadRequest(new { message = "Attribute name is required." });
            }

            var newAttr = new AttributeEntity
            {
                Name = dto.Name.Trim(),
                DisplayName = dto.DisplayName?.Trim(),
                IsActive = dto.IsActive ?? true,
                IsDeleted = false,
                CreatedDate = DateTime.Now,
                AttributeValues = dto.Values
                    .Where(v => !string.IsNullOrWhiteSpace(v.Value))
                    .Select(v => new AttributeValue
                    {
                        Value = v.Value.Trim(),
                        IsActive = v.IsActive ?? true,
                        IsDeleted = false,
                        CreatedDate = DateTime.Now
                    }).ToList()
            };

            await _context.Attributes.AddAsync(newAttr);
            await _context.SaveChangesAsync();

            // Plain projection, not the tracked entity - EF's relationship fixup wires
            // AttributeValue.Attribute back to this same instance, and serializing that
            // cycle (Attribute -> AttributeValues -> Attribute -> ...) throws.
            return Ok(new
            {
                newAttr.Id,
                newAttr.Name,
                newAttr.DisplayName,
                newAttr.IsActive,
                newAttr.CreatedDate,
                values = newAttr.AttributeValues.Select(v => new { v.Id, v.AttributeId, v.Value, v.IsActive })
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] AttributeSaveDto dto)
        {
            var existingAttr = await _context.Attributes
                .Include(a => a.AttributeValues)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (existingAttr == null)
            {
                return NotFound(new { message = $"Attribute with Id {id} not found." });
            }

            existingAttr.Name = dto.Name.Trim();
            existingAttr.DisplayName = dto.DisplayName?.Trim();
            existingAttr.IsActive = dto.IsActive ?? true;
            existingAttr.LastModifiedDate = DateTime.Now;

            var incomingValueIds = dto.Values.Where(v => v.Id > 0).Select(v => v.Id).ToHashSet();

            // 1. Soft-delete values removed in UI
            foreach (var existingVal in existingAttr.AttributeValues)
            {
                if (!incomingValueIds.Contains(existingVal.Id))
                {
                    existingVal.IsDeleted = true;
                    existingVal.LastModifiedDate = DateTime.Now;
                }
            }

            // 2. Update existing values in-place OR insert new values
            foreach (var valDto in dto.Values)
            {
                if (string.IsNullOrWhiteSpace(valDto.Value)) continue;

                if (valDto.Id > 0)
                {
                    var existingVal = existingAttr.AttributeValues.FirstOrDefault(v => v.Id == valDto.Id);
                    if (existingVal != null)
                    {
                        existingVal.Value = valDto.Value.Trim();
                        existingVal.IsActive = valDto.IsActive ?? true;
                        existingVal.IsDeleted = false;
                        existingVal.LastModifiedDate = DateTime.Now;
                    }
                }
                else
                {
                    existingAttr.AttributeValues.Add(new AttributeValue
                    {
                        AttributeId = id,
                        Value = valDto.Value.Trim(),
                        IsActive = valDto.IsActive ?? true,
                        IsDeleted = false,
                        CreatedDate = DateTime.Now
                    });
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                existingAttr.Id,
                existingAttr.Name,
                existingAttr.DisplayName,
                existingAttr.IsActive,
                existingAttr.CreatedDate,
                values = existingAttr.AttributeValues
                    .Where(v => v.IsDeleted != true)
                    .Select(v => new { v.Id, v.AttributeId, v.Value, v.IsActive })
            });
        }

        [HttpPost("{attributeId}/values")]
        public async Task<IActionResult> AddValue(int attributeId, [FromBody] AttributeValue val)
        {
            if (string.IsNullOrEmpty(val.Value))
            {
                return BadRequest(new { message = "Value string is required." });
            }

            val.AttributeId = attributeId;
            val.CreatedDate = DateTime.Now;
            val.IsDeleted = false;
            val.IsActive = true;

            await _context.AttributeValues.AddAsync(val);
            await _context.SaveChangesAsync();

            return Ok(new { val.Id, val.AttributeId, val.Value, val.IsActive });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var attr = await _context.Attributes
                .Include(a => a.AttributeValues)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (attr == null) return NotFound();

            attr.IsActive = false;
            attr.IsDeleted = true;
            attr.LastModifiedDate = DateTime.Now;

            foreach (var v in attr.AttributeValues)
            {
                v.IsActive = false;
                v.IsDeleted = true;
                v.LastModifiedDate = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}
