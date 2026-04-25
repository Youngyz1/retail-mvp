variable "region" {
  type = string
}

variable "network" {
  description = "VPC network ID for private IP"
  type        = string
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}
