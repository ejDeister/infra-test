output "db_bucket_name" {
  value = aws_s3_bucket.db.bucket
}

output "db_bucket_arn" {
  value = aws_s3_bucket.db.arn
}

output "images_bucket_name" {
  value = aws_s3_bucket.images.bucket
}

output "images_bucket_arn" {
  value = aws_s3_bucket.images.arn
}
