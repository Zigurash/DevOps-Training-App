project = "realworld"

environment = "dev"

aws_region = "ap-southeast-1"

availability_zone = "ap-southeast-1a"

vpc_cidr = "10.0.0.0/16"

public_subnet_cidr = "10.0.1.0/24"

instance_type = "t3.micro"

key_name = "realworld-project-key-main"

allowed_ssh_cidrs = [
  "0.0.0.0/0"
]
