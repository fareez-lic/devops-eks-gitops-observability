# DevOps EKS GitOps Observability

A production-style DevOps project that provisions an AWS EKS environment with Terraform, deploys applications through Argo CD, and provides monitoring with Prometheus and Grafana.

## Project status

🚧 In active development

## Planned architecture

```text
GitHub → Argo CD → Amazon EKS → Node.js application
                         └── Prometheus → Grafana
Terraform → AWS infrastructure (VPC, EKS, IAM)
```

## Technology stack

- AWS EKS
- Terraform
- Kubernetes
- Argo CD
- Prometheus
- Grafana
- Docker
- Node.js
- GitHub Actions

## Repository layout

```text
app/                Node.js sample application
infra/terraform/    AWS infrastructure as code
gitops/             Kubernetes manifests and Kustomize overlays
platform/           Argo CD and observability configuration
docs/               Architecture and deployment documentation
```

## Author

Fareez Lic  
GitHub: [@fareez-lic](https://github.com/fareez-lic)

## Attribution
This project is independently rebuilt and extended for learning and portfolio purposes. Its high-level learning path was inspired by the MIT-licensed [GitOps-with-monitoring](https://github.com/Amitabh-DevOps/GitOps-with-monitoring) project by Amitabh-DevOps.
