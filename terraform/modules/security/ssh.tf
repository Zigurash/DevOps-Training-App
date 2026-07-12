resource "aws_vpc_security_group_ingress_rule" "ssh" {

	security_group_id = aws_security_group.ec2.id

	from_port = 22

	to_port = 22

	ip_protocol = "tcp"

	for_each = toset(var.allowed_ssh_cidr)
	
	cidr_ipv4 = each.value

	description = "SSH access"
}
