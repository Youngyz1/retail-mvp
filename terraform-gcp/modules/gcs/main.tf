resource "google_storage_bucket" "velero" {
  name     = "${var.project_id}-velero-backups"
  location = var.region

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    action {
      type = "Delete"
    }
    condition {
      age = 30
    }
  }
}

resource "google_artifact_registry_repository" "retail_repo" {
  location      = var.region
  repository_id = "retail-repo"
  format        = "DOCKER"
  description   = "Retail MVP container images"
  project       = var.project_id
}
