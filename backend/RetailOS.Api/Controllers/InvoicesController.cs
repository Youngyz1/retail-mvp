using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;
using RetailOS.Api.Models;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _context;

    public InvoicesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var invoices = await _context.Invoices
            .Include(i => i.Order)
                .ThenInclude(o => o.Customer)
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new
            {
                i.Id,
                i.InvoiceRef,
                i.OrderId,
                OrderRef = i.Order!.OrderRef,
                CustomerName = i.Order.Customer!.Name,
                i.TotalAmount,
                i.AmountPaid,
                i.Status,
                i.IssuedAt
            })
            .ToListAsync();
            
        return Ok(invoices);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Order)
            .FirstOrDefaultAsync(i => i.Id == id);
            
        if (invoice == null) return NotFound();
        return Ok(invoice);
    }

    public class PaymentRequest { public decimal Amount { get; set; } }

    [HttpPost("{id}/payment")]
    public async Task<IActionResult> RecordPayment(int id, [FromBody] PaymentRequest req)
    {
        var invoice = await _context.Invoices.FindAsync(id);
        if (invoice == null) return NotFound();

        invoice.AmountPaid += req.Amount;
        if (invoice.AmountPaid >= invoice.TotalAmount)
        {
            invoice.Status = "PAID";
        }

        await _context.SaveChangesAsync();
        return Ok(new { invoice.Id, invoice.Status, invoice.AmountPaid });
    }
}
