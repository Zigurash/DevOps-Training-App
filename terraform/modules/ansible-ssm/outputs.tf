output "bucket_name" {
  value = aws_s3_bucket.ansible_ssm.id
}

output "bucket_arn" {
  value = aws_s3_bucket.ansible_ssm.arn
}
