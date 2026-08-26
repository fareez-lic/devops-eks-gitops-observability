# Troubleshooting and Lessons Learned

This page records real issues encountered while deploying the DevOps EKS GitOps Observability project and the steps used to resolve them.

## 1. AWS CLI was using the wrong account

### Symptom

AWS CLI commands returned the root identity for an older AWS account instead of the project account.

### Investigation

The identity check showed:

`arn:aws:iam::032968995148:root`

This was not the account used for the EKS project.

### Resolution

Switched the terminal to the correct AWS CLI profile:

`export AWS_PROFILE=fareez-admin`

Then verified the active identity:

`arn:aws:iam::803179100809:user/fareez-admin`

### Lesson learned

Always run `aws sts get-caller-identity` before Terraform apply or destroy. A terminal profile can change when a new terminal is opened.

## 2. EKS managed worker nodes failed to join

### Symptom

Terraform returned:

`NodeCreationFailure: Unhealthy nodes in the kubernetes cluster`

The EKS control plane was created, but the managed worker nodes did not become Ready.

### Investigation

The node role, private subnet route through NAT Gateway, EKS endpoint settings, and security configuration were checked. The relevant Terraform configuration showed that VPC CNI and kube-proxy were not configured to install before compute nodes.

### Resolution

Updated the EKS add-ons configuration:

`kube-proxy = { before_compute = true }`

`vpc-cni = { before_compute = true }`

Deleted the failed node group, applied Terraform again, and verified both worker nodes became `Ready`.

### Lesson learned

Networking add-ons are essential for worker nodes to communicate with the Kubernetes control plane. On this EKS configuration, they must be installed before managed compute nodes.
## 3. Kubernetes rejected the application container

### Symptom

The application Pod showed `CreateContainerConfigError`.

The Pod event said Kubernetes could not verify that the image user `node` was non-root.

### Investigation

The Docker image used `USER node`. This is a named user, and Kubernetes cannot prove that a named image user is non-root when the Pod security setting uses `runAsNonRoot: true`.

### Resolution

Added explicit numeric user and group IDs to the container security context:

`runAsUser: 1000`

`runAsGroup: 1000`

Then pushed the Git change and allowed Argo CD to redeploy the application. The Pod became `1/1 Running`.

### Lesson learned

For a hardened Kubernetes workload, use an explicit numeric non-root user in addition to `runAsNonRoot: true`.

## 4. Local port-forward ports were already in use

### Symptom

`kubectl port-forward` failed because local port `8080` was already in use.

### Resolution

Used separate available local ports:

- Application: `http://localhost:8081`
- Argo CD: `https://localhost:8082`
- Grafana: `http://localhost:3001`
- Prometheus: `http://localhost:9090`

### Lesson learned

`localhost` only works on the same laptop running `kubectl port-forward`. It does not expose the application to another computer. A LoadBalancer or Ingress would be required for public access.

## 5. Prometheus CRDs failed during Argo CD sync

### Symptom

The monitoring Argo CD Application returned errors such as:

`no matches for kind "Prometheus"`

and:

`metadata.annotations: Too long`

### Investigation

The kube-prometheus-stack chart installs large Custom Resource Definitions. Argo CD's normal client-side apply method exceeded Kubernetes' annotation-size limit before the Prometheus and Alertmanager resources could be created.

### Resolution

Updated the monitoring Argo CD Application with these sync options:

`ServerSideApply=true`

`Replace=true`

The monitoring CRDs were then created successfully.

### Lesson learned

Large Kubernetes CRDs can exceed the client-side apply annotation limit. Argo CD server-side apply and replace behavior are useful when deploying large operator-based charts.
## 6. Prometheus could not start because `gp3` storage was missing

### Symptom

The monitoring application stayed `Progressing`, and the Prometheus resource had no ready replica.

### Investigation

Prometheus Operator logs showed the exact error:

`storage class "gp3" does not exist`

The project requested persistent `gp3` storage for Prometheus, but the cluster did not have the AWS EBS CSI driver or a `gp3` Kubernetes StorageClass.

### Resolution

Added Terraform resources for:

- An IAM role trusted by the EBS CSI controller service account
- `AmazonEBSCSIDriverPolicy`
- The EKS `aws-ebs-csi-driver` add-on

Then created a GitOps-managed StorageClass using:

`provisioner: ebs.csi.aws.com`

`type: gp3`

After the driver was installed and the storage class existed, Prometheus created its StatefulSet and became healthy.

### Lesson learned

Persistent workloads on EKS need both an EBS CSI driver and a matching StorageClass. The Kubernetes manifest alone is not enough.

## 7. Argo CD project did not initially allow StorageClass

### Symptom

Argo CD reported:

`resource storage.k8s.io:StorageClass is not permitted in project gitops-demo`

### Resolution

Updated the Argo CD AppProject cluster resource allow-list to permit:

`group: storage.k8s.io`

`kind: StorageClass`

The storage manifest remained versioned in Git. A one-time direct apply was used as a bootstrap step while Argo CD refreshed its project authorization state. The Argo CD Application was then recreated without deleting running Kubernetes workloads, and both applications returned to `Synced` and `Healthy`.

### Lesson learned

Argo CD AppProjects must explicitly allow cluster-scoped resources such as StorageClass. Namespace permissions alone are not sufficient.

## 8. Prometheus did not initially scrape the Node.js application

### Symptom

Prometheus was healthy but initially showed only platform targets, such as Grafana and Kubernetes components.

### Resolution

Added a Kubernetes `ServiceMonitor` that selects the Node.js Service and calls the `/metrics` endpoint every 30 seconds.

Prometheus then discovered the target:

`serviceMonitor/gitops-demo/gitops-observability-demo/0`

The target displayed green `UP` status in Prometheus.

### Lesson learned

Exposing `/metrics` in an application is only the first step. Prometheus also needs a discovery configuration, such as a ServiceMonitor, to scrape it.

## Final verification

The completed environment was verified with:

- Two EKS worker nodes in `Ready` state
- Argo CD application `gitops-observability-demo`: `Synced` and `Healthy`
- Argo CD application `monitoring`: `Synced` and `Healthy`
- Grafana Kubernetes dashboard loaded
- Prometheus targets displayed green `UP`
- Prometheus successfully scraped the Node.js application metrics
