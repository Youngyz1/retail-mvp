using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _context;

    public DashboardController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var startOfMonth = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        
        var ordersToday = await _context.Orders
            .Where(o => o.CreatedAt >= today)
            .Include(o => o.Items)
            .ToListAsync();
            
        var ordersThisMonth = await _context.Orders
            .Where(o => o.CreatedAt >= startOfMonth)
            .Include(o => o.Items)
            .ToListAsync();
            
        var revenueToday = ordersToday.Where(o => o.Status != "Cancelled").Sum(o => o.Items.Sum(i => i.Subtotal));
        var revenueThisMonth = ordersThisMonth.Where(o => o.Status != "Cancelled").Sum(o => o.Items.Sum(i => i.Subtotal));
        
        var pendingOrdersCount = await _context.Orders.CountAsync(o => o.Status == "Pending");
        
        var unpaidInvoicesTotal = await _context.Invoices
            .Where(i => i.Status == "UNPAID")
            .SumAsync(i => i.TotalAmount - i.AmountPaid);
            
        var totalProducts = await _context.Products.CountAsync();
        
        var lowStockProducts = await _context.Products
            .Where(p => p.StockQuantity <= p.LowStockThreshold)
            .Select(p => new { p.Id, p.Name, Quantity = p.StockQuantity })
            .ToListAsync();
            
        var totalCustomers = await _context.Customers.CountAsync();

        var channelSplit = await _context.Orders
            .GroupBy(o => o.Channel)
            .ToDictionaryAsync(g => g.Key, g => g.Count());

        var sixMonthsAgo = new DateTime(today.Year, today.Month, 1).AddMonths(-5);
        var recentOrdersForChart = await _context.Orders
            .Where(o => o.CreatedAt >= sixMonthsAgo && o.Status != "Cancelled")
            .Include(o => o.Items)
            .ToListAsync();
            
        var monthlyRevenue = recentOrdersForChart
            .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
            .Select(g => new
            {
                period = $"{g.Key.Year}-{g.Key.Month:D2}",
                revenue = g.Sum(o => o.Items.Sum(i => i.Subtotal)),
                orders = g.Count()
            })
            .OrderBy(o => o.period)
            .ToList();

        var recentOrdersDisplay = await _context.Orders
            .Include(o => o.Customer)
            .Include(o => o.Items)
            .OrderByDescending(o => o.CreatedAt)
            .Take(5)
            .Select(o => new
            {
                o.Id,
                o.OrderRef,
                Customer = new { o.Customer!.Name },
                o.Channel,
                o.Status,
                Items = o.Items.Select(i => new { i.Subtotal }),
                o.CreatedAt
            })
            .ToListAsync();

        return Ok(new
        {
            revenue_today = revenueToday,
            revenue_this_month = revenueThisMonth,
            orders_today = ordersToday.Count,
            pending_orders = pendingOrdersCount,
            unpaid_invoices_total = unpaidInvoicesTotal,
            total_products = totalProducts,
            low_stock_count = lowStockProducts.Count,
            total_customers = totalCustomers,
            channel_split = channelSplit,
            monthly_revenue = monthlyRevenue,
            low_stock_alerts = lowStockProducts,
            recent_orders = recentOrdersDisplay
        });
    }
}
