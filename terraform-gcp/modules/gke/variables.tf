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
