using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;
using RetailOS.Api.Models;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/purchase-orders")]
public class PurchaseOrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public PurchaseOrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var pos = await _context.PurchaseOrders
            .Include(p => p.Supplier)
            .OrderByDescending(p => p.CreatedAt)
            .Select(p => new
            {
                p.Id,
                p.PoRef,
                Supplier = new { p.Supplier!.Name },
                p.Status,
                p.TotalCost,
                p.CreatedAt
            })
            .ToListAsync();

        return Ok(pos);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var po = await _context.PurchaseOrders
            .Include(p => p.Supplier)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (po == null) return NotFound();
        return Ok(po);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePORequest req)
    {
        var poRef = $"PO-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";

        // Calculate total cost from items
        decimal totalCost = (req.Items ?? new List<POItemRequest>())
            .Sum(i => i.Quantity * i.UnitCost);

        var po = new PurchaseOrder
        {
            PoRef = poRef,
            SupplierId = req.SupplierId,
            Status = "PENDING",
            TotalCost = totalCost,
            CreatedAt = DateTime.UtcNow
        };

        _context.PurchaseOrders.Add(po);
        await _context.SaveChangesAsync();

        return Ok(new { po.Id, po.PoRef });
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return NotFound();

        po.Status = req.Status;
        await _context.SaveChangesAsync();

        return Ok(new { po.Id, po.Status });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var po = await _context.PurchaseOrders.FindAsync(id);
        if (po == null) return NotFound();

        _context.PurchaseOrders.Remove(po);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    public class CreatePORequest
    {
        public int SupplierId { get; set; }
        public List<POItemRequest> Items { get; set; } = new();
    }

    public class POItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public decimal UnitCost { get; set; }
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
