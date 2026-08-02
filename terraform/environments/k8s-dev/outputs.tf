output "vpc_id" {

  value = module.network.vpc_id

}

output "ansible_ssm_bucket_name" {

  value = module.ansible-ssm.bucket_name

}
