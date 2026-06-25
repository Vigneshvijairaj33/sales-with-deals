@echo off
REM Set AWS credentials as environment variables before running this script
REM Or configure them using: aws configure
set AWS_DEFAULT_REGION=ap-south-1

echo 1. Unblocking public access...
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3api put-public-access-block --bucket dealradar-frontend1 --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

echo 2. Setting bucket policy...
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3api put-bucket-policy --bucket dealradar-frontend1 --policy file://"e:\e commerce app\bucket-policy.json"

echo 3. Enabling website hosting...
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3 website s3://dealradar-frontend1 --index-document index.html --error-document index.html

echo 4. Uploading files...
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3 sync "e:\e commerce app\dist" s3://dealradar-frontend1

echo 5. Verifying...
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" s3 ls s3://dealradar-frontend1 --recursive

echo DONE!
echo Your site: http://dealradar-frontend1.s3-website.ap-south-1.amazonaws.com
