resource "aws_vpc_security_group_ingress_rule" "nodeport" {
  security_group_id = aws_security_group.ec2.id

  ip_protocol = "tcp"
  from_port   = 30000
  to_port     = 32767

  cidr_ipv4 = "0.0.0.0/0"
}