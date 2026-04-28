resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

resource "google_secret_manager_secret" "db_url" {
  secret_id = "prod-db-url"
  project   = var.project_id

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "db_url" {
  secret      = google_secret_manager_secret.db_url.id
  secret_data = var.db_url
}

resource "google_secret_manager_secret_iam_member" "db_url_accessor" {
  secret_id = google_secret_manager_secret.db_url.secret_id
  project   = var.project_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.gke_sa_email}"
}

resource "google_secret_manager_secret" "jwt_key" {
  secret_id = "prod-jwt-key"
  project   = var.project_id

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "jwt_key" {
  secret      = google_secret_manager_secret.jwt_key.id
  secret_data = var.jwt_key
}

resource "google_secret_manager_secret_iam_member" "jwt_key_accessor" {
  secret_id = google_secret_manager_secret.jwt_key.secret_id
  project   = var.project_id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${var.gke_sa_email}"
}
