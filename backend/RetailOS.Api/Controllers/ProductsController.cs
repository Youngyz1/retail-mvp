using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;
using RetailOS.Api.Models;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class ProductsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ProductsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var products = await _context.Products
            .Include(p => p.Category)
            .OrderByDescending(p => p.Id)
            .ToListAsync();
            
        return Ok(products);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var product = await _context.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return NotFound();
        return Ok(product);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Product product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { id = product.Id }, product);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Product input)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Name = input.Name;
        product.Sku = input.Sku;
        product.Description = input.Description;
        product.Price = input.Price;
        product.StockQuantity = input.StockQuantity;
        product.LowStockThreshold = input.LowStockThreshold;
        product.CategoryId = input.CategoryId;

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return NoContent();
    }

    public class AdjustStockRequest { public int Quantity { get; set; } }

    [HttpPost("{id}/stock")]
    public async Task<IActionResult> AdjustStock(int id, [FromBody] AdjustStockRequest req)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.StockQuantity += req.Quantity; // Can be negative to reduce stock
        await _context.SaveChangesAsync();

        return Ok(new { message = "Stock adjusted", product.StockQuantity });
    }

    [HttpGet("{id}/logs")]
    public IActionResult Logs(int id)
    {
        // Mock empty stock logs since we don't have a model yet
        return Ok(new List<object>());
    }
}
