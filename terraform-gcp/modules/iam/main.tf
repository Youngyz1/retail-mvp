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

resource "google_project_iam_member" "sa_artifact_reader" {
  project = var.project_id
  role    = "roles/artifactregistry.reader"
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}

resource "google_project_iam_member" "sa_artifact_writer" {
  project = var.project_id
  role    = "roles/artifactregistry.writer"
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}

resource "google_project_iam_member" "sa_container_developer" {
  project = var.project_id
  role    = "roles/container.developer"
  member  = "serviceAccount:${google_service_account.gke_sa.email}"
}

resource "google_service_account_iam_member" "wif_binding" {
  service_account_id = google_service_account.gke_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/1058692805920/locations/global/workloadIdentityPools/github-pool/attribute.repository/Youngyz1/retail-mvp"
}

resource "google_service_account_iam_member" "token_creator" {
  service_account_id = google_service_account.gke_sa.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "principalSet://iam.googleapis.com/projects/1058692805920/locations/global/workloadIdentityPools/github-pool/attribute.repository/Youngyz1/retail-mvp"
}

