resource "google_container_cluster" "gke" {
  name                = "gke-cluster"
  location            = "${var.region}-a"  # Zonal (saves ~$74/month vs regional)
  deletion_protection = false

  remove_default_node_pool = true
  initial_node_count       = 1

  network    = var.network
  subnetwork = var.subnetwork

  private_cluster_config {
    enable_private_nodes    = true
    enable_private_endpoint = false
    master_ipv4_cidr_block  = "172.16.0.0/28"
  }

  ip_allocation_policy {
    cluster_secondary_range_name  = "pods-range"
    services_secondary_range_name = "services-range"
  }

  master_authorized_networks_config {
    cidr_blocks {
      cidr_block   = "0.0.0.0/0"
      display_name = "temp-open-for-dev"
    }
  }

  release_channel {
    channel = "REGULAR"
  }

  workload_identity_config {
    workload_pool = "${var.project_id}.svc.id.goog"
  }
}

resource "google_container_node_pool" "primary_nodes" {
  name     = "primary-node-pool"
  cluster  = google_container_cluster.gke.id
  location = "${var.region}-a"  # Must match cluster zone

  node_config {
    machine_type    = "e2-medium"
    spot            = true       # ~70% cheaper than on-demand
    disk_size_gb    = 30         # Reduced from 50
    disk_type       = "pd-standard"
    service_account = var.gke_sa_email
    oauth_scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  initial_node_count = 1  # Start with 1 (was 2)

  autoscaling {
    min_node_count = 1
    max_node_count = 3  # Reduced from 5
  }

  management {
    auto_repair  = true
    auto_upgrade = true
  }
}

