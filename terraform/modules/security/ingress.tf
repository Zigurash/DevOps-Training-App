resource "aws_security_group_rule" "kubernetes_api" {
  type              = "ingress"
  from_port         = 6443
  to_port           = 6443
  protocol          = "tcp"
  security_group_id = aws_security_group.ec2.id

  self = true
}

resource "aws_security_group_rule" "kubelet" {
  type              = "ingress"
  from_port         = 10250
  to_port           = 10250
  protocol          = "tcp"
  security_group_id = aws_security_group.ec2.id

  self = true
}

resource "aws_security_group_rule" "kubernetes_api_local" {
  type              = "ingress"
  from_port         = 6443
  to_port           = 6443
  protocol          = "tcp"
  security_group_id = aws_security_group.ec2.id

  cidr_blocks = var.allowed_ssh_cidrs
}