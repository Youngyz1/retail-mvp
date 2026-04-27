resource "google_sql_database_instance" "postgres" {
  name                = "postgres-instance"
  database_version    = "POSTGRES_15"
  region              = var.region
  deletion_protection = false

  settings {
    tier = "db-f1-micro"  # Cheapest tier (~$8/month vs $52)

    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network
    }

    availability_type = "ZONAL"  # No HA replica (saves ~$25/month)

    backup_configuration {
      enabled                        = false  # No backups for dev
      point_in_time_recovery_enabled = false
    }

    disk_autoresize_limit = 20  # Reduced from 100

    maintenance_window {
      day          = 7
      hour         = 3
      update_track = "stable"
    }
  }
}

resource "google_sql_database" "db" {
  name     = "app_db"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "user" {
  name     = "app_user"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}
