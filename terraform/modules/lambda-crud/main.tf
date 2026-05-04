# Dependencies must be installed in Lambda/ before apply: cd Lambda && npm install
data "archive_file" "lambda" {
  type        = "zip"
  source_dir  = "${path.root}/../Lambda"
  output_path = "${path.root}/lambda.zip"
}

resource "aws_iam_role" "lambda" {
  name = "${var.app_name}-lambda-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${var.app_name}-lambda-policy"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
        Resource = [
          "${var.db_bucket_arn}/*",
          "${var.images_bucket_arn}/*",
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["s3:ListBucket"]
        Resource = [var.db_bucket_arn, var.images_bucket_arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
    ]
  })
}

resource "aws_lambda_function" "crud" {
  function_name    = "${var.app_name}-crud"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs20.x"
  handler          = "handlers.handler"
  filename         = data.archive_file.lambda.output_path
  source_code_hash = data.archive_file.lambda.output_base64sha256

  environment {
    variables = {
      DB_BUCKET     = var.db_bucket_name
      IMAGES_BUCKET = var.images_bucket_name
    }
  }
}

resource "aws_lambda_function_url" "crud" {
  function_name      = aws_lambda_function.crud.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = ["*"]
    allow_methods     = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers     = ["Content-Type"]
    max_age           = 3600
  }
}
