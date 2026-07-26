resource "aws_vpc_security_group_ingress_rule" "prometheus" {
  security_group_id = aws_security_group.ec2.id

  cidr_ipv4 = var.allowed_ssh_cidrs[0]

  from_port = 9090
  to_port   = 9090

  ip_protocol = "tcp"

  description = "Prometheus"
}
