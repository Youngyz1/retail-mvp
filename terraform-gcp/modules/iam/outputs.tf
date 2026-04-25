output "gke_sa_email" {
  description = "GKE service account email"
  value       = google_service_account.gke_sa.email
}
