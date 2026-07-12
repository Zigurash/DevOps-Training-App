resource "aws_vpc_security_group_egress_rule" "all" {

  security_group_id = aws_security_group.ec2.id

  cidr_ipv4 = "0.0.0.0/0"

  ip_protocol = "-1"

  description = "Allow all outbound traffic"

}
