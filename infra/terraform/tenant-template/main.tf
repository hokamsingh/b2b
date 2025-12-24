terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

variable "tenant_id" {
  type = string
}

variable "subdomain" {
  type = string
}

variable "vpc_id" {
  description = "The VPC ID where resources will be created"
  type        = string
  default     = "vpc-12345678" # Example default
}

variable "tier" {
  description = "Tenant Tier (trial, standard, macro)"
  type        = string
  default     = "standard"
}

# 1. ISOLATION: Dedicated Database (RDS) or Schema
# For "Macro" tier, we might spin up a dedicated instance.
resource "aws_db_instance" "tenant_db" {
  count                = var.tier == "trial" ? 0 : 1 # Skip DB for trial tenants (use shared)
  allocated_storage    = 20
  db_name              = "tenant_${var.tenant_id}"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.t3.micro"
  username             = "admin_${var.tenant_id}"
  password             = "secure_password_placeholder" # Use Secrets Manager in real world
  skip_final_snapshot  = true
  publicly_accessible  = false
  tags = {
    Tenant = var.tenant_id
  }
}

variable "shared_bucket_name" {
  description = "Name of the shared S3 bucket for all tenants"
  type        = string
  default     = "b2b-demo-assets" 
}

# 2. ISOLATION: IAM Role for Pods (IRSA)
resource "aws_iam_role" "tenant_pod_role" {
  name = "tenant-${var.tenant_id}-pod-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRoleWithWebIdentity"
        Effect = "Allow"
        Principal = {
          Federated = "arn:aws:iam::123456789012:oidc-provider/oidc.eks.us-east-1.amazonaws.com/id/EXAMPLED539D98691E"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "tenant_s3_policy" {
  name = "tenant-${var.tenant_id}-s3-policy"
  role = aws_iam_role.tenant_pod_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:ListBucket"]
        Resource = ["arn:aws:s3:::${var.shared_bucket_name}"]
        Condition = {
          StringLike = {
            "s3:prefix" = ["${var.tenant_id}/*"]
          }
        }
      },
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = ["arn:aws:s3:::${var.shared_bucket_name}/${var.tenant_id}/*"]
      }
    ]
  })
}

# 3. DOMAIN POINTING: Route53 Record
data "aws_route53_zone" "main" {
  name         = "example.com"
  private_zone = false
}

resource "aws_route53_record" "tenant_subdomain" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.subdomain}.example.com"
  type    = "CNAME"
  ttl     = 300
  records = ["ingress-controller.example.com"]
}

output "db_endpoint" {
  value = aws_db_instance.tenant_db.endpoint
}
