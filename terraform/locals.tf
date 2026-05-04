locals {
  enable_domain = var.domain_name != "" && var.route53_zone_id != ""
}
