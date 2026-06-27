output "cluster_name" {
  description = "Nome do cluster Kubernetes criado."
  value       = kind_cluster.oficina_cluster.name
}

output "kubeconfig_path" {
  description = "Caminho do kubeconfig gerado pelo Kind."
  value       = kind_cluster.oficina_cluster.kubeconfig_path
}

output "api_url" {
  description = "URL local para acessar a API."
  value       = "http://localhost:${var.api_host_port}"
}

output "postgres_service_name" {
  description = "Nome do Service interno do PostgreSQL."
  value       = kubernetes_service.postgres_service.metadata[0].name
}

output "api_service_name" {
  description = "Nome do Service da API."
  value       = kubernetes_service.api_service.metadata[0].name
}
