namespace RetailOS.Api.Models;

public record LoginRequest(string Email, string Password);
public record RegisterRequest([property: System.Text.Json.Serialization.JsonPropertyName("email")] string Email, [property: System.Text.Json.Serialization.JsonPropertyName("password")] string Password, [property: System.Text.Json.Serialization.JsonPropertyName("fullName")] string FullName);
public record ForgotPasswordRequest(string Email);
public record ExternalLoginRequest(string Provider, string Token);
public record AuthResponse(string Token, string Email, string Role, string FullName);
