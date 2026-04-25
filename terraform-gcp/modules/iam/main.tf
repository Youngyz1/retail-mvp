resource "google_service_account" "gke_sa" {
  account_id   = "gke-app-sa"
  display_name = "GKE App Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "sa_roles" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}
