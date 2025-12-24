# Cost Optimization Plan ("The Casino Strategy")

**Context**: 24/7 Betting Operations. "Sleepy" (Stop/Start) infrastructure is **NOT** viable for active tenants as availability is revenue.

## 1. Compute Optimization (Stateless)
*   **Strategy**: **AWS EC2 Spot Instances** for EVERYTHING stateless.
*   **Why**: Betting traffic is spiky (e.g., during live matches). Spot instances save **70-90%**.
*   **Reliability**: Kubernetes handles Spot interruptions automatically. WebSocket connections automatically reconnect.
*   **Auto-Scaling**: Use **HPA (Horizontal Pod Autoscaler)** (Implemented).
    *   *Friday Night*: Scale to 50 replicas.
    *   *Tuesday Morning*: Scale to 2 replicas (Minimum HA).
    *   **Cost Impact**: You pay strictly for the traffic load, not peak capacity.
    *   *Note*: **KEDA** (Scale-to-Zero) is preserved for the "Future Roadmap" to avoid cold starts in Production.

## 2. Database Optimization (Stateful)
*   **Challenge**: 24/7 Active. Cannot stop databases.
*   **Strategy A: Reserved Instances (RI) for Production**
    *   Commit to 1 Year or 3 Year terms for your RDS instances.
    *   **Savings**: **~40-60%** off On-Demand.
    *   **Sacrifice Nothing**: Same dedicated hardware, just cheaper billing model.

*   **Strategy B: Hybrid Tenant Tiers**
    *   **Premium/Active Tenants**: **Dedicated RDS Instance**. (Hardware Isolation).
    *   **Trial/Demo/Archived Tenants**: **Consolidated Shared RDS**.
        *   Run 100 small tenants on 1 large `db.r6g.xlarge`.
        *   **Savings**: 90% vs running 100 tiny DBs.
        *   *Note*: When a Trial tenant converts to Paid, we migrate them to a Dedicated Instance via backup/restore.

## 3. Infrastructure Control Plane
*   **Kafka (MSK Serverless)**: perfect for Betting. Spikes during games, low usage otherwise. Pay per throughput.
*   **Cassandra (Keyspaces)**: Serverless Pay-per-Request.

## 5. Summary Table

| Component | Standard (On-Demand) | Optimized Strategy | Estimated Savings |
| :--- | :--- | :--- | :--- |
| **Compute** | Fixed Peak Capacity | **Spot + Autoscaling** | **~80%** |
| **Database** | On-Demand Hourly | **Reserved Instances (1yr)** | **~40%** |
| **Trial Tenants** | Separate DB ($15/ea) | **Shared DB Host** | **~90%** |
| **Total** | | | **~65% Overall** |
