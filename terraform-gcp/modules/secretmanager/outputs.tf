output "db_url_secret_id" {
  value = google_secret_manager_secret.db_url.secret_id
}

output "jwt_key_secret_id" {
  value = google_secret_manager_secret.jwt_key.secret_id
}
