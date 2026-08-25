variable "aws_region" {
  description = "AWS region for the EKS environment."
  type        = string
  default     = "us-east-1"
}

variable "cluster_name" {
  description = "Name of the EKS cluster."
  type        = string
  default     = "gitops-observability-demo"
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
  default     = "dev"
}

variable "allowed_public_cidrs" {
  description = "CIDR ranges allowed to reach the EKS public API endpoint. Use your own public IP with /32."
  type        = list(string)
}
