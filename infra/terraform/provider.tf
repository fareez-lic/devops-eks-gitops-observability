provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "devops-eks-gitops-observability"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Repository  = "fareez-lic/devops-eks-gitops-observability"
    }
  }
}
