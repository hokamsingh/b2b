# B2B Multi-Tenant SaaS Demo

## Introduction
This project demonstrates a production-grade, highly scalable **B2B Multi-Tenant SaaS** platform. It moves beyond simple "logical separation" to provide a **Backend-for-Frontend (BFF)** architecture where each tenant runs as an isolated "Tenant Pod" with dedicated compute and data resources. It features a "Master Tenant" that orchestrates on-demand provisioning using Terraform (AWS) and Helm (Kubernetes).

## Architecture
The system follows a **Pod-based Architecture** orchestrated by a Master Control Plane.

### Core Components
1.  **Tenant Pod**: A collection of services dedicated to a single tenant.
    *   **User Backend**: Node.js/Express service for the User Frontend.
    *   **Admin Backend**: Node.js/Express service for the Admin Frontend and Migrations.
    *   **Job Scheduler**: Background worker for tasks (Email, Cleanup).
2.  **Master Pod ("Super Tenant")**:
    *   Identical architecture to a Tenant Pod but with `IS_MASTER=true`.
    *   **Features**: Tenant Provisioning API (`POST /tenants`), Analytics Consumption (Kafka -> Cassandra).
3.  **Infrastructure**:
    *   **Kubernetes (EKS)**: Orchestrates the pods.
    *   **AWS RDS**: Dedicated Database Instances for tenants.
    *   **Kafka**: Event bus for system-wide analytics.
    *   **Redis**: Job queues for provisioning and background tasks.

## Frontend Architecture & Routing (Dynamic/SSR)
How `john.example.com` works with **Dynamic Frontends** (e.g., Next.js, Remix):

1.  **Ingress Routing**:
    *   `john.example.com/api/*` -> **User Backend Service** (Node/Express).
    *   `john.example.com/*` -> **User Frontend Service** (Node/Next.js/SSR container).
2.  **Frontend Service**:
    *   Runs as a dedicated container in the Tenant Pod.
    *   Handles **Server-Side Rendering (SSR)** or serves dynamic assets.
    *   Can fetch data from the co-located User Backend internally (server-to-server) or the client can fetch via `/api`.
3.  **API Communication**:
    *   **Browser**: Fetches `/api/user/config`. Ingress routes this to the Backend Service.
    *   **SSR**: The Frontend Server can fetch `http://user-backend:5000/api/user/config` internally.

## Isolation Strategy
We implement a **Shared-Nothing (at the leaf)** isolation model to guarantee performance and security.

*   **Compute Isolation**: Each tenant runs in its own Kubernetes Deployment set (User, Admin, Scheduler). A crash in Tenant A's pod does not affect Tenant B.
*   **Data Isolation**: 
    *   **Database**: **Strict Hard Isolation** via Dedicated AWS RDS Instances.
    *   **File Storage**: **Folder Isolation** in a Shared S3 Bucket. IAM Policies strictly enforce that Tenant A can only access `s3://shared-bucket/tenant-a/*`.
*   **Network Isolation**: Ingress Controllers use Host-based routing (`tenant.example.com`). Traffic is routed strictly to the specific Tenant Service Cluster IP.

## Scaling Strategy
The platform is designed to scale in three dimensions:

1.  **On-Demand Provisioning**:
    *   **Mechanism**: Master Admin triggers a request -> Redis Queue -> Provisioning Worker.
    *   **Action**: Worker executes `terraform apply` (creates RDS, IAM, S3) and `helm install` (deploys Pods).
    *   **Time-to-Live**: ~2 minutes (dominated by RDS spin-up).
2.  **Horizontal Scaling (Per Tenant)**:
    *   The **User Backend** is stateless. It can be scaled from 1 to $N$ replicas via HPA (Horizontal Pod Autoscaler) based on CPU/Memory usage.
3.  **System Scaling**:
    *   The Master components (Ingress, Kafka, Master DB) scale independently of tenants.

## Cost Optimization ("The Casino Strategy")
Designed for **24/7 Availability** with **~65% Savings**.

### 1. Compute: Spot Instances
*   **Strategy**: Run stateless Tenant Pods on **AWS Spot Instances**.
*   **Why**: Saves **70-90%**. Betting traffic is spiky.
*   **Reliability**: Kubernetes handles interruptions. Users rejoin instantly.

### 2. Database: Hybrid Model
*   **Production**: **Reserved Instances (RI)** (1-3 yr commit) for ~50% savings. Dedicated Hardware.
*   **Trial**: **Shared RDS Host**. 100 small tenants on 1 large DB. ~90% savings.

### 3. Serverless Control Plane
*   Use **MSK Serverless** (Kafka) and **Amazon Keyspaces** (Cassandra) to pay only for throughput/requests, avoiding high fixed costs for the "Master" components.

## Back of Envelope Calculation
*Estimating capacity for a "Micro" tier tenant.*

*   **Assumptions**:
    *   `db.t3.micro` RDS (~2 vCPU, 1GB RAM).
    *   Node.js Backend Pod (~100m CPU request).
    *   Average Request Latency: 50ms.
*   **Database Limits**: `db.t3.micro` supports ~100 max connections.
*   **Throughput**: 
    *   With connection pooling (e.g., 20 pool size), we can handle ~400 requests/sec per tenant before DB saturation (assuming simple CRUD).
*   **Cost (Rough Estimate)**:
    *   RDS: ~$15/mo
    *   Spot Instances (K8s): ~$10/mo
    *   **Total Base Cost per Tenant**: ~$25/mo.

## Future Roadmap

### 1. Advanced Cost Orchestration
- **Spot Flotillas**: Mix instance types (t3, c5, m5) to minimize interruption capability.
- **Micro-Tenant Freezing**: For non-paying tenants, scale K8s deployments to 0 (KEDA) and pause RDS (if dedicated) when inactive for >1 hour.

### 2. Tenant "Ejection" (Enterprise Tier)
- **Goal**: Move a high-value tenant to their *own* AWS Account for Security/Compliance.
- **Plan**:
    1.  **Terraform**: Export the `tenant-template` state.
    2.  **Snapshot**: Create a final RDS snapshot.
    3.  **Cross-Account Share**: Share snapshot with Tenant's AWS Account.
    4.  **Restore**: Spin up new infrastructure in their account using the existing Terraform template.
    5.  **DNS Update**: Update `tenant.example.com` CNAME to point to the new Load Balancer.

