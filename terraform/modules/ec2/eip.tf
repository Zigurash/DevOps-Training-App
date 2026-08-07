resource "aws_eip" "main" {
  count  = var.enable_eip ? 1 : 0
  domain = "vpc"

  tags = {
    Name        = "${var.project}-${var.environment}-${var.name_suffix}-eip"
    Project     = var.project
    Environment = var.environment
    Role        = var.role
  }
}

resource "aws_eip_association" "main" {
  count         = var.enable_eip ? 1 : 0
  allocation_id = aws_eip.main[0].id
  instance_id   = aws_instance.main.id
}