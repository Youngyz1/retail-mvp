resource "google_compute_security_policy" "retail_armor" {
  name        = "retail-cloud-armor"
  description = "WAF policy for retail MVP"

  rule {
    action      = "allow"
    priority    = 500
    description = "Allow all API endpoints"
    match {
      expr {
        expression = "request.path.matches('/api/.*')"
      }
    }
  }

  rule {
    action      = "allow"
    priority    = 900
    description = "Allow auth endpoints"
    match {
      expr {
        expression = "request.path.matches('/api/auth/.*')"
      }
    }
  }

  rule {
    action      = "deny(403)"
    priority    = 1000
    description = "Block SQL injection"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('sqli-v33-stable')"
      }
    }
  }

  rule {
    action      = "deny(403)"
    priority    = 1002
    description = "Block remote code execution incl Log4Shell"
    match {
      expr {
        expression = "evaluatePreconfiguredExpr('rce-v33-stable')"
      }
    }
  }

  rule {
    action      = "rate_based_ban"
    priority    = 2000
    description = "Rate limit per IP"
    match {
      expr {
        expression = "true"
      }
    }
    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"
      enforce_on_key = "IP"
      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
      ban_duration_sec = 300
    }
  }

  rule {
    action      = "allow"
    priority    = 2147483647
    description = "default rule"
    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }
  }
}