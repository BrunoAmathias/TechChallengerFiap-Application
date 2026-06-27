variable "cluster_name" {
  description = "Nome do cluster Kubernetes local criado com Kind."
  type        = string
  default     = "oficina-cluster"
}

variable "node_image" {
  description = "Imagem dos nodes do cluster Kind."
  type        = string
  default     = "kindest/node:v1.29.2"
}

variable "api_image" {
  description = "Imagem Docker da API."
  type        = string
  default     = "backend-api:latest"
}

variable "api_replicas" {
  description = "Quantidade inicial de réplicas da API."
  type        = number
  default     = 2
}

variable "db_name" {
  description = "Nome do banco de dados PostgreSQL."
  type        = string
  default     = "oficina"
}

variable "db_user" {
  description = "Usuário do banco de dados PostgreSQL."
  type        = string
  default     = "postgres"
}

variable "db_password" {
  description = "Senha do banco de dados PostgreSQL."
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "Chave secreta utilizada para geração e validação de JWT."
  type        = string
  sensitive   = true
}

variable "mock_user_email" {
  description = "E-mail do usuário mockado para autenticação ou testes."
  type        = string
  sensitive   = true
}

variable "mock_user_password" {
  description = "Senha do usuário mockado para autenticação ou testes."
  type        = string
  sensitive   = true
}

variable "mock_user_id" {
  description = "ID do usuário mockado."
  type        = string
  sensitive   = true
}

variable "postgres_storage" {
  description = "Tamanho do volume persistente usado pelo PostgreSQL."
  type        = string
  default     = "1Gi"
}


variable "api_host_port" {
  description = "Porta exposta na máquina local para acessar a API."
  type        = number
  default     = 30080
}

variable "api_node_port" {
  description = "NodePort utilizado pelo Service da API dentro do Kubernetes."
  type        = number
  default     = 30000
}
