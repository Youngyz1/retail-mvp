variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "gke_sa_email" {
  description = "GKE app service account email"
  type        = string
}

variable "db_url" {
  description = "Full PostgreSQL connection URL"
  type        = string
  sensitive   = true
}

variable "jwt_key" {
  description = "JWT signing key"
  type        = string
  sensitive   = true
}
