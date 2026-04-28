variable "project_id" {
  type = string
}

variable "region" {
  type = string
}

variable "network" {
  description = "VPC network ID"
  type        = string
}

variable "subnetwork" {
  description = "Subnet ID"
  type        = string
}

variable "gke_sa_email" {
  description = "Service account email for GKE nodes"
  type        = string
}

variable "spot" {
  description = "Use spot VMs for nodes"
  type        = bool
  default     = true
}

variable "machine_type" {
  description = "Node machine type"
  type        = string
  default     = "e2-medium"
}

variable "min_nodes" {
  description = "Minimum nodes in pool"
  type        = number
  default     = 1
}

variable "max_nodes" {
  description = "Maximum nodes in pool"
  type        = number
  default     = 3
}

variable "disk_size_gb" {
  description = "Node disk size in GB"
  type        = number
  default     = 30
}
