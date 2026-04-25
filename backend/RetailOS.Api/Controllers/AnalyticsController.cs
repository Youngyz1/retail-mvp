using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Data;

namespace RetailOS.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/analytics")]
public class AnalyticsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AnalyticsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAnalytics()
    {
        try
        {
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6).Date;

            // Get all orders with items
            var orders = await _context.Orders
                .Where(o => o.CreatedAt >= sixMonthsAgo && o.Status != "Cancelled")
                .Include(o => o.Items)
                    .ThenInclude(i => i.Product)
                .ToListAsync();

            // Monthly revenue
            var revenueByMonth = orders
                .GroupBy(o => new { o.CreatedAt.Year, o.CreatedAt.Month })
                .Select(g => new
                {
                    period = $"{g.Key.Year}-{g.Key.Month:D2}",
                    revenue = g.Sum(o => o.Items.Sum(i => i.Subtotal)),
                    orders = g.Count()
                })
                .OrderBy(o => o.period)
                .ToList();

            // Top products
            var topProducts = orders
                .SelectMany(o => o.Items)
                .Where(i => i.Product != null)
                .GroupBy(i => new { i.ProductId, i.Product!.Name, i.Product!.Sku })
                .Select(g => new
                {
                    product_id = g.Key.ProductId,
                    name = g.Key.Name,
                    sku = g.Key.Sku,
                    total_sold = g.Sum(i => i.Quantity),
                    total_revenue = g.Sum(i => i.Subtotal)
                })
                .OrderByDescending(p => p.total_revenue)
                .Take(10)
                .ToList();

            // Revenue by category - just use empty list if no categories
            var revenueByCategory = new List<object>();
            try
            {
                var productsWithCategories = await _context.Products
                    .Include(p => p.Category)
                    .ToListAsync();

                revenueByCategory = orders
                    .SelectMany(o => o.Items)
                    .Where(i => i.Product != null)
                    .GroupBy(i => i.Product!.CategoryId)
                    .Select(g =>
                    {
                        var categoryName = productsWithCategories
                            .FirstOrDefault(p => p.Id == g.First().ProductId)?
                            .Category?.Name ?? "Unknown";
                        return new
                        {
                            category = categoryName,
                            revenue = g.Sum(i => i.Subtotal)
                        };
                    })
                    .OrderByDescending(c => c.revenue)
                    .Cast<object>()
                    .ToList();
            }
            catch
            {
                // If category loading fails, return empty
            }

            // Online vs Store
            var onlineVsStore = orders
                .GroupBy(o => o.Channel)
                .ToDictionary(g => g.Key, g => g.Count());

            // KPIs
            var totalRevenue = orders.Sum(o => o.Items.Sum(i => i.Subtotal));
            var totalOrdersCount = orders.Count();
            var avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0m;

            return Ok(new
            {
                revenue_by_month = revenueByMonth,
                top_products = topProducts,
                revenue_by_category = revenueByCategory,
                online_vs_store = onlineVsStore,
                total_revenue = totalRevenue,
                total_orders = totalOrdersCount,
                avg_order_value = avgOrderValue
            });
        }
        catch (Exception ex)
        {
            System.Console.WriteLine($"Analytics Error: {ex.Message}");
            System.Console.WriteLine($"Stack: {ex.StackTrace}");
            return StatusCode(500, new { error = ex.Message, stack = ex.StackTrace });
        }
    }
}
