variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "db_password" {
  type      = string
  sensitive = true
}

variable "db_url" {
  type      = string
  sensitive = true
}

variable "jwt_key" {
  type      = string
  sensitive = true
}

variable "slack_channel" {
  description = "Slack channel for alerts"
  type        = string
}

variable "slack_auth_token" {
  description = "Slack bot OAuth token"
  type        = string
  sensitive   = true
}
