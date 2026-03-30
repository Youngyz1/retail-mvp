using Microsoft.AspNetCore.Identity;

namespace RetailOS.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string FullName { get; set; } = string.Empty;
}
