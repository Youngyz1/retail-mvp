terraform {
  backend "gcs" {
    bucket  = "youngyz-tf-state-12345"
    prefix  = "gcp/dev"
  }
}
