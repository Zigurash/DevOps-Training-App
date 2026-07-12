resource "aws_vpc_security_group_ingress_rule" "https" {

  security_group_id = aws_security_group.ec2.id

  cidr_ipv4 = "0.0.0.0/0"

  from_port = 443

  to_port = 443

  ip_protocol = "tcp"

  description = "HTTPS"

}
