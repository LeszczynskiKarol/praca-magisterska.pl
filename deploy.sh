#!/bin/bash
S3_BUCKET="www.praca-magisterska.pl"
CLOUDFRONT_ID="E2FEZZEGU1WQAP"

cd /d/praca-magisterska.pl
npm run build
aws s3 sync dist/ s3://${S3_BUCKET} --delete
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*"
echo "✅ Deployed to https://www.praca-magisterska.pl"