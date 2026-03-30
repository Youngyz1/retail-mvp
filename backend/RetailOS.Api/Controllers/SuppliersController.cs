using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;
using RetailOS.Api.Models;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class SuppliersController : ControllerBase
{
    private readonly AppDbContext _context;

    public SuppliersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var suppliers = await _context.Suppliers
            .OrderByDescending(s => s.Id)
            .Select(s => new
            {
                s.Id,
                s.Name,
                s.ContactEmail,
                s.ContactPhone
            })
            .ToListAsync();
            
        return Ok(suppliers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var supplier = await _context.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound();
        return Ok(supplier);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Supplier input)
    {
        _context.Suppliers.Add(input);
        await _context.SaveChangesAsync();
        return Ok(input);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Supplier input)
    {
        var supp = await _context.Suppliers.FindAsync(id);
        if (supp == null) return NotFound();

        supp.Name = input.Name;
        supp.ContactEmail = input.ContactEmail;
        supp.ContactPhone = input.ContactPhone;

        await _context.SaveChangesAsync();
        return Ok(supp);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var supp = await _context.Suppliers.FindAsync(id);
        if (supp == null) return NotFound();

        _context.Suppliers.Remove(supp);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
