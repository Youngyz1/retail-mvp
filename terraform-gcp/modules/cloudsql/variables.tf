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

variable "tier" {
  description = "Cloud SQL machine tier"
  type        = string
  default     = "db-f1-micro"
}

variable "availability_type" {
  description = "ZONAL or REGIONAL"
  type        = string
  default     = "ZONAL"
}

variable "backups_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = false
}

variable "disk_limit" {
  description = "Max disk autoresize limit in GB"
  type        = number
  default     = 20
}
