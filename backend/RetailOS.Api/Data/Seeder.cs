using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RetailOS.Api.Models;

namespace RetailOS.Api.Data;

public static class Seeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        await context.Database.MigrateAsync();

        string[] roles = { "Admin", "Manager", "Cashier", "User" };
        foreach (var role in roles)
        {
            if (!await roleManager.RoleExistsAsync(role))
            {
                await roleManager.CreateAsync(new IdentityRole(role));
            }
        }

        // Create test users if they don't exist
        var adminEmail = "admin@retailos.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        if (adminUser == null)
        {
            adminUser = new ApplicationUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                FullName = "Admin User"
            };
            var adminResult = await userManager.CreateAsync(adminUser, "Admin@123456");
            if (adminResult.Succeeded)
            {
                await userManager.AddToRoleAsync(adminUser, "Admin");
            }
        }

        var userEmail = "user@retailos.com";
        var testUser = await userManager.FindByEmailAsync(userEmail);
        if (testUser == null)
        {
            testUser = new ApplicationUser
            {
                UserName = userEmail,
                Email = userEmail,
                FullName = "Test User"
            };
            var userResult = await userManager.CreateAsync(testUser, "User@123456");
            if (userResult.Succeeded)
            {
                await userManager.AddToRoleAsync(testUser, "User");
            }
        }

        if (!context.Categories.Any())
        {
            var electronics = new Category { Name = "Electronics", Description = "Devices and gadgets" };
            var clothing = new Category { Name = "Clothing", Description = "Apparel" };
            var home = new Category { Name = "Home", Description = "Furniture and kitchenware" };

            context.Categories.AddRange(electronics, clothing, home);
            await context.SaveChangesAsync();

            var products = new List<Product>
            {
                new Product { Name = "Wireless Headphones", Sku = "WH-001", Price = 99.99m, StockQuantity = 50, CategoryId = electronics.Id },
                new Product { Name = "Smartphone", Sku = "SP-002", Price = 699.00m, StockQuantity = 15, CategoryId = electronics.Id },
                new Product { Name = "Running Shoes", Sku = "RS-001", Price = 89.99m, StockQuantity = 5, CategoryId = clothing.Id },
                new Product { Name = "Coffee Maker", Sku = "CM-001", Price = 49.99m, StockQuantity = 100, CategoryId = home.Id }
            };

            context.Products.AddRange(products);
            await context.SaveChangesAsync();

            var customer = new Customer { Name = "Alice Johnson", Email = "alice@example.com", Phone = "555-0199" };
            var customer2 = new Customer { Name = "Bob Smith", Email = "bob@example.com" };
            context.Customers.AddRange(customer, customer2);
            await context.SaveChangesAsync();

            var order = new Order
            {
                OrderRef = "ORD-SEED-001",
                CustomerId = customer.Id,
                Status = "Completed",
                CreatedAt = DateTime.UtcNow.AddDays(-2),
                Items = new List<OrderItem>
                {
                    new OrderItem { ProductId = products[0].Id, Quantity = 1, UnitPrice = 99.99m },
                    new OrderItem { ProductId = products[1].Id, Quantity = 1, UnitPrice = 699.00m }
                }
            };
            
            var order2 = new Order
            {
                OrderRef = "ORD-SEED-002",
                CustomerId = customer2.Id,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                Items = new List<OrderItem>
                {
                    new OrderItem { ProductId = products[2].Id, Quantity = 2, UnitPrice = 89.99m }
                }
            };

            context.Orders.AddRange(order, order2);
            await context.SaveChangesAsync();
            
            var invoice = new Invoice
            {
                OrderId = order.Id,
                InvoiceRef = "INV-SEED-001",
                TotalAmount = 798.99m,
                AmountPaid = 798.99m,
                Status = "PAID"
            };

            var invoice2 = new Invoice
            {
                OrderId = order2.Id,
                InvoiceRef = "INV-SEED-002",
                TotalAmount = 179.98m,
                AmountPaid = 0m,
                Status = "UNPAID"
            };
            
            context.Invoices.AddRange(invoice, invoice2);
            await context.SaveChangesAsync();
        }
    }
}
