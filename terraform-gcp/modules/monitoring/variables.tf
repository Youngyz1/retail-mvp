variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "slack_channel" {
  description = "Slack channel name e.g. #alerts"
  type        = string
}

variable "slack_auth_token" {
  description = "Slack bot OAuth token"
  type        = string
  sensitive   = true
}
