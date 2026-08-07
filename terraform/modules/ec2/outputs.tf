output "public_ip" {
  value = (
    var.enable_eip
      ? aws_eip.main[0].public_ip
      : aws_instance.main.public_ip
  )
}

output "private_ip" {
  value = aws_instance.main.private_ip
}

output "instance_id" {
  value = aws_instance.main.id
}

output "private_dns" {
  value = aws_instance.main.private_dns
}