resource "aws_security_group" "ec2" {

  name = "${local.name_prefix}-ec2-sg"

  description = "Security group for EC2 instances"

  vpc_id = var.vpc_id

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-ec2-sg"
    }
  )
}
