data "aws_caller_identity" "current" {}


resource "aws_s3_bucket" "ansible_ssm" {
  bucket = "${var.project}-${var.environment}-ansible-ssm-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "${var.project}-${var.environment}-ansible-ssm"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
