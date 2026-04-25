using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;
using RetailOS.Api.Models;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var customers = await _context.Customers
            .Select(c => new
            {
                c.Id,
                c.Name,
                c.Email,
                c.Phone,
                c.CreatedAt
            })
            .OrderByDescending(c => c.Id)
            .ToListAsync();

        return Ok(customers);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var customer = await _context.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Customer input)
    {
        _context.Customers.Add(input);
        await _context.SaveChangesAsync();
        return Ok(input);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Customer input)
    {
        var cust = await _context.Customers.FindAsync(id);
        if (cust == null) return NotFound();

        cust.Name = input.Name;
        cust.Email = input.Email;
        cust.Phone = input.Phone;

        await _context.SaveChangesAsync();
        return Ok(cust);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var cust = await _context.Customers.FindAsync(id);
        if (cust == null) return NotFound();

        _context.Customers.Remove(cust);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpGet("{id}/orders")]
    public async Task<IActionResult> Orders(int id)
    {
        var orders = await _context.Orders
            .Where(o => o.CustomerId == id)
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.OrderRef,
                o.Status,
                o.Channel,
                o.CreatedAt,
                Total = o.Items.Sum(i => i.Subtotal)
            })
            .ToListAsync();
            
        return Ok(orders);
    }
}
