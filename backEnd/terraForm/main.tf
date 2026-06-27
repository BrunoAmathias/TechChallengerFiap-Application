terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.11.0"
    }

    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.30"
    }
  }
}

provider "kind" {}

resource "kind_cluster" "oficina_cluster" {
  name           = var.cluster_name
  node_image     = var.node_image
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"

    }

    node {
      role = "worker"
    }
  }
}

provider "kubernetes" {
  config_path    = kind_cluster.oficina_cluster.kubeconfig_path
  config_context = "kind-${var.cluster_name}"
}

resource "kubernetes_secret" "api_secret" {
  metadata {
    name = "api-secret"
  }

  data = {
    DB_PASSWORD        = var.db_password
    JWT_SECRET         = var.jwt_secret
    MOCK_USER_EMAIL    = var.mock_user_email
    MOCK_USER_PASSWORD = var.mock_user_password
    MOCK_USER_ID       = var.mock_user_id
  }

  type = "Opaque"

  depends_on = [
    kind_cluster.oficina_cluster
  ]
}

resource "kubernetes_config_map" "api_config" {
  metadata {
    name = "api-config"
  }

  data = {
    DB_HOST = "postgres-service"
    DB_NAME = var.db_name
    DB_PORT = "5432"
    DB_USER = var.db_user
  }

  depends_on = [
    kind_cluster.oficina_cluster
  ]
}

resource "kubernetes_persistent_volume_claim" "postgres_pvc" {
  metadata {
    name = "postgres-pvc"
  }

  wait_until_bound = false

  spec {
    access_modes = ["ReadWriteOnce"]

    resources {
      requests = {
        storage = var.postgres_storage
      }
    }
  }

  depends_on = [
    kind_cluster.oficina_cluster
  ]
}

resource "kubernetes_deployment" "postgres" {
  metadata {
    name = "postgres"

    labels = {
      app = "postgres"
    }
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "postgres"
      }
    }

    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }

      spec {
        container {
          name  = "postgres"
          image = "postgres:15"

          port {
            container_port = 5432
          }

          env {
            name  = "POSTGRES_DB"
            value = var.db_name
          }

          env {
            name  = "POSTGRES_USER"
            value = var.db_user
          }

          env {
            name = "POSTGRES_PASSWORD"

            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_secret.metadata[0].name
                key  = "DB_PASSWORD"
              }
            }
          }

          volume_mount {
            name       = "postgres-storage"
            mount_path = "/var/lib/postgresql/data"
          }
        }

        volume {
          name = "postgres-storage"

          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.postgres_pvc.metadata[0].name
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_secret.api_secret,
    kubernetes_persistent_volume_claim.postgres_pvc
  ]
}

resource "kubernetes_service" "postgres_service" {
    
  wait_for_load_balancer = false

  metadata {
    name = "postgres-service"
  }

  spec {
    selector = {
      app = "postgres"
    }

    port {
      port        = 5432
      target_port = 5432
    }
  }

  depends_on = [
    kubernetes_deployment.postgres
  ]
}

resource "kubernetes_deployment" "oficina_api" {
  metadata {
    name = "oficina-api"

    labels = {
      app = "oficina-api"
    }
  }

  spec {
    replicas = var.api_replicas

    selector {
      match_labels = {
        app = "oficina-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "oficina-api"
        }
      }

      spec {
        container {
          name              = "api"
          image             = var.api_image
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 3000
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.api_config.metadata[0].name
            }
          }

          env {
            name = "DB_PASSWORD"

            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_secret.metadata[0].name
                key  = "DB_PASSWORD"
              }
            }
          }

          env {
            name = "JWT_SECRET"

            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_secret.metadata[0].name
                key  = "JWT_SECRET"
              }
            }
          }

          env {
            name = "MOCK_USER_EMAIL"

            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_secret.metadata[0].name
                key  = "MOCK_USER_EMAIL"
              }
            }
          }

          env {
            name = "MOCK_USER_PASSWORD"

            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_secret.metadata[0].name
                key  = "MOCK_USER_PASSWORD"
              }
            }
          }

          env {
            name = "MOCK_USER_ID"

            value_from {
              secret_key_ref {
                name = kubernetes_secret.api_secret.metadata[0].name
                key  = "MOCK_USER_ID"
              }
            }
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }

            limits = {
              cpu    = "500m"
              memory = "512Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/health"
              port = 3000
            }

            initial_delay_seconds = 15
            period_seconds        = 20
          }

          readiness_probe {
            http_get {
              path = "/health"
              port = 3000
            }

            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }

  depends_on = [
    kubernetes_config_map.api_config,
    kubernetes_secret.api_secret,
    kubernetes_service.postgres_service
  ]
}

resource "kubernetes_service" "api_service" {
    
  wait_for_load_balancer = false

  metadata {
    name = "api-service"
  }


  spec {
    type = "LoadBalancer"

    selector = {
      app = "oficina-api"
    }

    port {
      name        = "http"
      protocol    = "TCP"
      port        = 3000
      target_port = 3000
    }
  }



  depends_on = [
    kubernetes_deployment.oficina_api
  ]
}

resource "kubernetes_horizontal_pod_autoscaler_v2" "api_hpa" {
  metadata {
    name = "api-hpa"
  }

  spec {
    min_replicas = 2
    max_replicas = 10

    scale_target_ref {
      api_version = "apps/v1"
      kind        = "Deployment"
      name        = kubernetes_deployment.oficina_api.metadata[0].name
    }

    metric {
      type = "Resource"

      resource {
        name = "cpu"

        target {
          type                = "Utilization"
          average_utilization = 70
        }
      }
    }

    metric {
      type = "Resource"

      resource {
        name = "memory"

        target {
          type                = "Utilization"
          average_utilization = 80
        }
      }
    }
  }

  depends_on = [
    kubernetes_deployment.oficina_api
  ]
}