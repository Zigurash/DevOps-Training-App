data "aws_ami" "ubuntu" {

  most_recent = true

  owners = ["099720109477"]

  filter {
    name = "name"

    values = [
      "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*"
    ]
  }

  filter {
    name = "virtualization-type"

    values = ["hvm"]
  }

}

resource "aws_instance" "main" {
  ami = data.aws_ami.ubuntu.id

  instance_type = var.instance_type
  subnet_id = var.subnet_id

  vpc_security_group_ids = [
    var.security_group_id
  ]

  key_name = var.key_name
  iam_instance_profile = var.instance_profile_name
  user_data = file("${path.module}/user_data.sh")

  lifecycle {
    ignore_changes = [
	ami
    ]
  }

  tags = {

    Name = "${var.project}-${var.environment}-${var.role}-${var.name_suffix}-ec2"
    Project     = var.project
    Environment = var.environment
    Role        = var.role
    ManagedBy   = "Terraform"

  }

}
