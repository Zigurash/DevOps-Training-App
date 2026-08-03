resource "aws_security_group_rule" "calico_bgp" {
  type              = "ingress"
  from_port         = 179
  to_port           = 179
  protocol          = "tcp"
  security_group_id = aws_security_group.ec2.id

  self = true
}