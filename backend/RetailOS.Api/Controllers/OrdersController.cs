using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;
using RetailOS.Api.Models;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;

    public OrdersController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var orders = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new
            {
                o.Id,
                o.OrderRef,
                Customer = new { o.Customer!.Name },
                o.Status,
                o.Channel,
                Total = o.Items.Sum(i => i.Subtotal),
                o.CreatedAt
            })
            .ToListAsync();
            
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Get(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
                .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);
            
        if (order == null) return NotFound();

        var response = new
        {
            order.Id,
            order.OrderRef,
            order.CreatedAt,
            order.Status,
            order.Channel,
            Customer = order.Customer,
            Items = order.Items.Select(i => new
            {
                i.Id,
                i.ProductId,
                ProductName = i.Product?.Name,
                i.Quantity,
                i.UnitPrice,
                i.Subtotal
            }),
            TotalAmount = order.Items.Sum(i => i.Subtotal)
        };

        return Ok(response);
    }

    public class CreateOrderRequest
    {
        public int CustomerId { get; set; }
        public string Channel { get; set; } = "ONLINE";
        public List<OrderItemRequest> Items { get; set; } = new();
    }

    public class OrderItemRequest
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOrderRequest req)
    {
        // Generate random OrderRef
        var orderRef = $"ORD-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";
        
        var order = new Order
        {
            OrderRef = orderRef,
            CustomerId = req.CustomerId,
            Channel = req.Channel,
            Status = "Pending"
        };
        
        decimal total = 0;

        foreach (var reqItem in req.Items)
        {
            var product = await _context.Products.FindAsync(reqItem.ProductId);
            if (product == null) continue;
            
            // Reduce stock
            product.StockQuantity -= reqItem.Quantity;

            var item = new OrderItem
            {
                ProductId = reqItem.ProductId,
                Quantity = reqItem.Quantity,
                UnitPrice = product.Price
            };
            
            total += item.Subtotal;
            order.Items.Add(item);
        }

        _context.Orders.Add(order);
        
        // Auto-generate Invoice
        var invoice = new Invoice
        {
            InvoiceRef = $"INV-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}",
            TotalAmount = total,
            AmountPaid = 0,
            Status = "UNPAID",
            Order = order
        };
        _context.Invoices.Add(invoice);

        await _context.SaveChangesAsync();
        return Ok(new { order.Id, order.OrderRef, invoice.InvoiceRef });
    }

    public class UpdateStatusRequest { public string Status { get; set; } = string.Empty; }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest req)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        order.Status = req.Status;
        await _context.SaveChangesAsync();

        return Ok(new { order.Id, order.Status });
    }
}
