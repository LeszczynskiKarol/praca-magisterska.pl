#!/bin/bash

# =============================================================================
# Deploy praca-magisterska.pl — Astro SSG → S3 + CloudFront + Google Indexing
# =============================================================================

S3_BUCKET="www.praca-magisterska.pl"
CLOUDFRONT_ID="E2FEZZEGU1WQAP"
SITE_URL="https://www.praca-magisterska.pl"
REGION="eu-central-1"

cd /d/praca-magisterska.pl

echo "📦 Pushing to GitHub..."
git add .
git commit -m "git push from local"
git push origin main

if [ $? -ne 0 ]; then
  echo "❌ Git push failed!"
  exit 1
fi

echo "🔨 Building..."
npm run build

echo "☁️  Syncing to S3..."
aws s3 sync dist/ s3://${S3_BUCKET} --delete

echo "🔄 Invalidating CloudFront..."
aws cloudfront create-invalidation --distribution-id ${CLOUDFRONT_ID} --paths "/*" > /dev/null

echo "✅ Deployed to ${SITE_URL}"

# =============================================================================
# Google Indexing Notification
# =============================================================================
echo ""
echo "🔍 Notifying Google of changes..."

# 1. Ping sitemap (instant, no auth)
curl -s "https://www.google.com/ping?sitemap=${SITE_URL}/sitemap-index.xml" > /dev/null
echo "  ✅ Sitemap ping sent"

# 2. Lambda: diff sitemap + Indexing API + Search Console API
aws lambda invoke \
  --function-name google-indexing-notifier \
  --payload "{\"siteUrl\":\"${SITE_URL}\"}" \
  --cli-binary-format raw-in-base64-out \
  --region ${REGION} \
  /tmp/indexing-result.json > /dev/null 2>&1

if [ $? -eq 0 ]; then
  # Parse result
  NEW_COUNT=$(cat /tmp/indexing-result.json | grep -o '"newUrls":\[[^]]*\]' | grep -o 'https://' | wc -l)
  REMOVED_COUNT=$(cat /tmp/indexing-result.json | grep -o '"removedUrls":\[[^]]*\]' | grep -o 'https://' | wc -l)
  ERRORS=$(cat /tmp/indexing-result.json | grep -o '"errors":\[[^]]*\]' | grep -o '"[^"]*"' | wc -l)
  
  echo "  ✅ Indexing API: +${NEW_COUNT} new, -${REMOVED_COUNT} removed, ${ERRORS} errors"
else
  echo "  ⚠️  Lambda invoke failed (deploy succeeded, indexing skipped)"
fi

echo ""
echo "🎉 Done! ${SITE_URL} deployed and Google notified."
