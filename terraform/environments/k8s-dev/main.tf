module "network" {

  source = "../../modules/network"

  project     = var.project
  environment = var.environment

  vpc_cidr           = var.vpc_cidr
  public_subnet_cidr = var.public_subnet_cidr
  availability_zone  = var.availability_zone

}

module "security" {

  source = "../../modules/security"

  project     = var.project
  environment = var.environment

  vpc_id = module.network.vpc_id

  allowed_ssh_cidrs = var.allowed_ssh_cidrs

}

module "iam" {

  source = "../../modules/iam"

  project     = var.project
  environment = var.environment

}


module "ec2" {

  source = "../../modules/ec2"

  project     = var.project
  environment = var.environment

  subnet_id = module.network.public_subnet_id

  security_group_id = module.security.ec2_security_group_id

  instance_type = var.instance_type

  key_name = var.key_name

  instance_profile_name = module.iam.instance_profile_name

  role = "control"
  name_suffix = "control"

}

module "worker1" {

  source = "../../modules/ec2"

  project     = var.project
  environment = var.environment

  subnet_id = module.network.public_subnet_id

  security_group_id = module.security.ec2_security_group_id

  instance_type = var.instance_type

  key_name = var.key_name

  instance_profile_name = module.iam.instance_profile_name

  role = "worker"
  name_suffix = "worker-1"

}

module "worker2" {

  source = "../../modules/ec2"

  project     = var.project
  environment = var.environment

  subnet_id = module.network.public_subnet_id

  security_group_id = module.security.ec2_security_group_id

  instance_type = var.instance_type

  key_name = var.key_name

  instance_profile_name = module.iam.instance_profile_name

  role = "worker"
  name_suffix = "worker-2"

}

module "ansible-ssm" {
  source = "../../modules/ansible-ssm"

  project     = var.project
  environment = var.environment
}

resource "local_file" "ansible_vars" {
  filename = "${path.module}/../../../ansible/inventories/k8s-dev/group_vars/all.yml"

  content = <<-EOT
    ansible_aws_ssm_bucket_name: "${module.ansible-ssm.bucket_name}"
  EOT
}
