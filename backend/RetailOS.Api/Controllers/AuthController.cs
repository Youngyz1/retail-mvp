using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using RetailOS.Api.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace RetailOS.Api.Controllers;

[Route("auth")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;

    public AuthController(UserManager<ApplicationUser> userManager, IConfiguration configuration)
    {
        _userManager = userManager;
        _configuration = configuration;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return Unauthorized("Invalid credentials.");

        var token = GenerateJwtToken(user);
        return Ok(new AuthResponse(token, user.Email!, user.Role ?? "User", user.FullName));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var user = new ApplicationUser { UserName = request.Email, Email = request.Email, FullName = request.FullName, Role = "User" };
        
        // For demonstration, let's make the first user an Admin
        if (!_userManager.Users.Any()) user.Role = "Admin";
        
        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded) return BadRequest(result.Errors);

        return Ok("User registered successfully");
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var email = User.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email)) return Unauthorized();

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return NotFound("User not found.");

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FullName,
            user.Role
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            // Do not reveal that the user does not exist
            return Ok(new { message = "If this email is registered, a reset link will be sent." });
        }

        // Normally we'd send an email here with a token
        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        
        return Ok(new { message = "If this email is registered, a reset link will be sent.", tokenContentForDev = token });
    }

    [HttpPost("external-login")]
    public async Task<IActionResult> ExternalLogin([FromBody] ExternalLoginRequest request)
    {
        // MOCK VALIDATION: We assume the token provided by the frontend is the user's email for simplicity,
        // since we don't have developer keys. In production, we would use external provider APIs to validate the token.
        
        if (string.IsNullOrEmpty(request.Token)) return BadRequest("Invalid Token");

        // We use the token itself as the fake email in our mock flow
        var fakeEmail = request.Token;
        
        var user = await _userManager.FindByEmailAsync(fakeEmail);
        if (user == null)
        {
            // Auto-register external user
            user = new ApplicationUser 
            { 
                UserName = fakeEmail, 
                Email = fakeEmail, 
                FullName = $"{request.Provider} User",
                Role = "User"
            };
            var createResult = await _userManager.CreateAsync(user);
            if(!createResult.Succeeded) return BadRequest("Could not create user for external login.");
        }

        var jwt = GenerateJwtToken(user);
        return Ok(new AuthResponse(jwt, user.Email!, user.Role ?? "User", user.FullName));
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT Key config is missing");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Role, user.Role ?? "User")
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(2),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
