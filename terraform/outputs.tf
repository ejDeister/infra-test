output "function_url" {
  value = module.lambda_crud.function_url
}

output "frontend_bucket_name" {
  value = module.cloudfront.frontend_bucket_name
}

output "distribution_id" {
  value = module.cloudfront.distribution_id
}

output "cloudfront_domain" {
  value = module.cloudfront.cloudfront_domain
}
