# ── Enable APIs ───────────────────────────────────────────────────────────────
resource "google_project_service" "monitoring" {
  service            = "monitoring.googleapis.com"
  disable_on_destroy = false
}

# ── Slack Notification Channel ────────────────────────────────────────────────
resource "google_monitoring_notification_channel" "slack" {
  display_name = "Slack Alerts"
  type         = "slack"
  project      = var.project_id

  labels = {
    channel_name = var.slack_channel
  }

  sensitive_labels {
    auth_token = var.slack_auth_token
  }

  depends_on = [google_project_service.monitoring]
}

# ── 1. Backend CPU > 60% for 5 min ───────────────────────────────────────────
resource "google_monitoring_alert_policy" "high_cpu" {
  display_name = "High CPU — retail-app backend"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "CPU utilization > 60%"
    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND resource.labels.namespace_name=\"retail-app\" AND resource.labels.container_name=\"backend\" AND metric.type=\"kubernetes.io/container/cpu/limit_utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.6
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "Backend CPU has exceeded 60% for 5 minutes. Consider scaling up."
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 2. Backend Memory > 70% for 5 min ────────────────────────────────────────
resource "google_monitoring_alert_policy" "high_memory" {
  display_name = "High Memory — retail-app backend"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "Memory utilization > 70%"
    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND resource.labels.namespace_name=\"retail-app\" AND resource.labels.container_name=\"backend\" AND metric.type=\"kubernetes.io/container/memory/limit_utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.7
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "Backend memory has exceeded 70% for 5 minutes. Check for memory leaks."
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 3. Pod restarts > 1 ───────────────────────────────────────────────────────
resource "google_monitoring_alert_policy" "pod_restarts" {
  display_name = "Pod Restarts — retail-app"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "Container restart count > 1"
    condition_threshold {
      filter          = "resource.type=\"k8s_container\" AND resource.labels.namespace_name=\"retail-app\" AND metric.type=\"kubernetes.io/container/restart_count\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1
      duration        = "60s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }

  documentation {
    content   = "A container in retail-app has restarted more than once. Run: kubectl logs -n retail-app <pod>"
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 4. Cloud SQL connections > 80 ────────────────────────────────────────────
resource "google_monitoring_alert_policy" "db_connections" {
  display_name = "Cloud SQL — High DB Connections"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "DB connections > 80"
    condition_threshold {
      filter          = "resource.type=\"cloudsql_database\" AND resource.labels.database_id=\"${var.project_id}:postgres-instance\" AND metric.type=\"cloudsql.googleapis.com/database/postgresql/num_backends\""
      comparison      = "COMPARISON_GT"
      threshold_value = 80
      duration        = "120s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "Cloud SQL connection count is high. Check for connection pool exhaustion."
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 5. Node CPU > 60% ────────────────────────────────────────────────────────
resource "google_monitoring_alert_policy" "node_cpu" {
  display_name = "Node CPU — GKE cluster"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "Node CPU utilization > 60%"
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND resource.labels.cluster_name=\"gke-cluster\" AND metric.type=\"kubernetes.io/node/cpu/allocatable_utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.6
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "A GKE node CPU has exceeded 60% for 5 minutes. Consider adding nodes or checking for runaway pods."
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 6. Node Memory > 70% ─────────────────────────────────────────────────────
resource "google_monitoring_alert_policy" "node_memory" {
  display_name = "Node Memory — GKE cluster"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "Node memory utilization > 70%"
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND resource.labels.cluster_name=\"gke-cluster\" AND metric.type=\"kubernetes.io/node/memory/allocatable_utilization\""
      comparison      = "COMPARISON_GT"
      threshold_value = 0.7
      duration        = "300s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "A GKE node memory has exceeded 70% for 5 minutes. Check for memory pressure with: kubectl describe nodes"
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 7. Pod in Pending/Failed state ───────────────────────────────────────────
resource "google_monitoring_alert_policy" "pod_not_running" {
  display_name = "Pod Not Running — retail-app"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "Pod not in Running state"
    condition_threshold {
      filter          = "resource.type=\"k8s_pod\" AND resource.labels.namespace_name=\"retail-app\" AND metric.type=\"kubernetes.io/pod/volume/total_bytes\""
      comparison      = "COMPARISON_LT"
      threshold_value = 1
      duration        = "120s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "A pod in retail-app is Pending or Failed. Run: kubectl get pods -n retail-app"
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 8. Node Disk Pressure ─────────────────────────────────────────────────────
resource "google_monitoring_alert_policy" "node_disk" {
  display_name = "Node Disk Pressure — GKE cluster"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "Node disk usage > 80%"
    condition_threshold {
      filter          = "resource.type=\"k8s_node\" AND resource.labels.cluster_name=\"gke-cluster\" AND metric.type=\"kubernetes.io/node/ephemeral_storage/used_bytes\""
      comparison      = "COMPARISON_GT"
      threshold_value = 85899345920 # 80 GB in bytes — adjust to your node disk size
      duration        = "120s"
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_MEAN"
      }
    }
  }

  documentation {
    content   = "A GKE node is under disk pressure. Run: kubectl describe nodes | grep -A5 'Conditions'"
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}

# ── 9. Kubernetes API Server latency ─────────────────────────────────────────
resource "google_monitoring_alert_policy" "k8s_api_latency" {
  display_name = "K8s API Server — High Latency"
  combiner     = "OR"
  project      = var.project_id

  alert_strategy { auto_close = "1800s" }

  conditions {
    display_name = "API server latency > 1s"
    condition_threshold {
      filter          = "resource.type=\"k8s_cluster\" AND resource.labels.cluster_name=\"gke-cluster\" AND metric.type=\"apiserver.googleapis.com/request/duration\""
      comparison      = "COMPARISON_GT"
      threshold_value = 1000 # milliseconds
      duration        = "300s"
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_DELTA"
        cross_series_reducer = "REDUCE_PERCENTILE_99"
      }
    }
  }

  documentation {
    content   = "Kubernetes API server p99 latency exceeded 1 second. Check control plane health and etcd."
    mime_type = "text/markdown"
  }

  notification_channels = [google_monitoring_notification_channel.slack.id]
  depends_on            = [google_project_service.monitoring]
}