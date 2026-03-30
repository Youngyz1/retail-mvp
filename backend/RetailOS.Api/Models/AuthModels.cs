namespace RetailOS.Api.Models;

public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string FullName);
public record ForgotPasswordRequest(string Email);
public record ExternalLoginRequest(string Provider, string Token);
public record AuthResponse(string Token, string Email, string Role, string FullName);
