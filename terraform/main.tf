terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}

module "storage" {
  source   = "./modules/storage"
  app_name = var.app_name
}

module "lambda_crud" {
  source             = "./modules/lambda-crud"
  app_name           = var.app_name
  db_bucket_name     = module.storage.db_bucket_name
  db_bucket_arn      = module.storage.db_bucket_arn
  images_bucket_name = module.storage.images_bucket_name
  images_bucket_arn  = module.storage.images_bucket_arn
}

module "cloudfront" {
  source              = "./modules/cloudfront"
  app_name            = var.app_name
  domain_name         = var.domain_name
  acm_certificate_arn = var.acm_certificate_arn
}

module "domain_mapping" {
  count             = local.enable_domain ? 1 : 0
  source            = "./modules/domain-mapping"
  domain_name       = var.domain_name
  cloudfront_domain = module.cloudfront.cloudfront_domain
  zone_id           = var.route53_zone_id
}
