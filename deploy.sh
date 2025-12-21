#!/bin/bash
# Deploy script for praca-magisterska.pl
# Konfiguracja identyczna jak by-interior.pl: S3 + CloudFront + redirect apex → www

set -e

DOMAIN="praca-magisterska.pl"
WWW_DOMAIN="www.praca-magisterska.pl"
HOSTED_ZONE_ID="Z0329497RDPG5QQA6J28"
REGION="eu-central-1"
PROJECT_PATH="d:/praca-magisterska.pl"

echo "=========================================="
echo "Deploy: $DOMAIN"
echo "=========================================="

# ============================================
# KROK 1: Tworzenie bucketów S3
# ============================================
echo ""
echo "[1/8] Tworzenie bucketów S3..."

# Bucket dla www (główny hosting)
aws s3api create-bucket \
    --bucket "$WWW_DOMAIN" \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION \
    2>/dev/null || echo "Bucket $WWW_DOMAIN już istnieje"

# Bucket dla apex (redirect)
aws s3api create-bucket \
    --bucket "$DOMAIN" \
    --region $REGION \
    --create-bucket-configuration LocationConstraint=$REGION \
    2>/dev/null || echo "Bucket $DOMAIN już istnieje"

echo "✓ Buckety utworzone"

# ============================================
# KROK 2: Konfiguracja hostingu www bucket
# ============================================
echo ""
echo "[2/8] Konfiguracja hostingu statycznego dla $WWW_DOMAIN..."

aws s3 website "s3://$WWW_DOMAIN" \
    --index-document index.html \
    --error-document 404.html

echo "✓ Hosting statyczny skonfigurowany"

# ============================================
# KROK 3: Konfiguracja redirect apex → www
# ============================================
echo ""
echo "[3/8] Konfiguracja redirect $DOMAIN → $WWW_DOMAIN..."

aws s3api put-bucket-website \
    --bucket "$DOMAIN" \
    --website-configuration '{
        "RedirectAllRequestsTo": {
            "HostName": "'"$WWW_DOMAIN"'",
            "Protocol": "https"
        }
    }'

echo "✓ Redirect skonfigurowany"

# ============================================
# KROK 4: Publiczny dostęp dla bucketów
# ============================================
echo ""
echo "[4/8] Konfiguracja publicznego dostępu..."

# Wyłącz block public access dla obu bucketów
for BUCKET in "$DOMAIN" "$WWW_DOMAIN"; do
    aws s3api put-public-access-block \
        --bucket "$BUCKET" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
done

# Policy dla www bucket (hosting)
aws s3api put-bucket-policy \
    --bucket "$WWW_DOMAIN" \
    --policy '{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "PublicReadGetObject",
                "Effect": "Allow",
                "Principal": "*",
                "Action": "s3:GetObject",
                "Resource": "arn:aws:s3:::'"$WWW_DOMAIN"'/*"
            }
        ]
    }'

echo "✓ Publiczny dostęp skonfigurowany"

# ============================================
# KROK 5: Certyfikat SSL (us-east-1 dla CloudFront)
# ============================================
echo ""
echo "[5/8] Tworzenie certyfikatu SSL..."

# Sprawdź czy certyfikat już istnieje
EXISTING_CERT=$(aws acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN'].CertificateArn" \
    --output text)

if [ -z "$EXISTING_CERT" ] || [ "$EXISTING_CERT" == "None" ]; then
    CERT_ARN=$(aws acm request-certificate \
        --region us-east-1 \
        --domain-name "$DOMAIN" \
        --subject-alternative-names "*.$DOMAIN" \
        --validation-method DNS \
        --query 'CertificateArn' \
        --output text)
    echo "Nowy certyfikat: $CERT_ARN"
    
    echo "Czekam 10s na wygenerowanie rekordów walidacyjnych..."
    sleep 10
else
    CERT_ARN="$EXISTING_CERT"
    echo "Używam istniejącego certyfikatu: $CERT_ARN"
fi

# Pobierz dane do walidacji DNS
echo ""
echo "Pobieram dane walidacyjne certyfikatu..."
VALIDATION_DATA=$(aws acm describe-certificate \
    --region us-east-1 \
    --certificate-arn "$CERT_ARN" \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

VALIDATION_NAME=$(echo "$VALIDATION_DATA" | grep -o '"Name": "[^"]*"' | cut -d'"' -f4)
VALIDATION_VALUE=$(echo "$VALIDATION_DATA" | grep -o '"Value": "[^"]*"' | cut -d'"' -f4)

if [ -n "$VALIDATION_NAME" ] && [ -n "$VALIDATION_VALUE" ]; then
    echo "Dodaję rekord walidacyjny DNS..."
    
    aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch '{
            "Changes": [{
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "'"$VALIDATION_NAME"'",
                    "Type": "CNAME",
                    "TTL": 300,
                    "ResourceRecords": [{"Value": "'"$VALIDATION_VALUE"'"}]
                }
            }]
        }' > /dev/null
    
    echo "✓ Rekord walidacyjny dodany"
    echo ""
    echo "Czekam na walidację certyfikatu (może potrwać 1-5 minut)..."
    
    aws acm wait certificate-validated \
        --region us-east-1 \
        --certificate-arn "$CERT_ARN" \
        2>/dev/null || echo "Timeout - sprawdź status ręcznie"
fi

echo "✓ Certyfikat gotowy: $CERT_ARN"

# ============================================
# KROK 6: CloudFront dla www (główna dystrybucja)
# ============================================
echo ""
echo "[6/8] Tworzenie CloudFront dla $WWW_DOMAIN..."

WWW_CF_CONFIG=$(cat <<EOF
{
    "CallerReference": "www-praca-magisterska-$(date +%Y%m%d%H%M%S)",
    "Aliases": {
        "Quantity": 1,
        "Items": ["$WWW_DOMAIN"]
    },
    "DefaultRootObject": "index.html",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$WWW_DOMAIN",
            "DomainName": "$WWW_DOMAIN.s3-website.$REGION.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only",
                "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]},
                "OriginReadTimeout": 30,
                "OriginKeepaliveTimeout": 5
            }
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$WWW_DOMAIN",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["HEAD", "GET"],
            "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "CustomErrorResponses": {
        "Quantity": 1,
        "Items": [{
            "ErrorCode": 404,
            "ResponsePagePath": "/404.html",
            "ResponseCode": "404",
            "ErrorCachingMinTTL": 300
        }]
    },
    "Comment": "praca-magisterska.pl - www hosting",
    "Enabled": true,
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "PriceClass": "PriceClass_100",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF
)

WWW_CF_RESULT=$(aws cloudfront create-distribution \
    --distribution-config "$WWW_CF_CONFIG" \
    --output json 2>&1) || true

if echo "$WWW_CF_RESULT" | grep -q "DistributionAlreadyExists\|CNAMEAlreadyExists"; then
    echo "Dystrybucja www już istnieje"
    WWW_CF_DOMAIN=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Aliases.Items, '$WWW_DOMAIN')].DomainName" \
        --output text)
else
    WWW_CF_DOMAIN=$(echo "$WWW_CF_RESULT" | grep -o '"DomainName": "[^"]*"' | head -1 | cut -d'"' -f4)
fi

echo "✓ CloudFront www: $WWW_CF_DOMAIN"

# ============================================
# KROK 7: CloudFront dla apex (redirect)
# ============================================
echo ""
echo "[7/8] Tworzenie CloudFront dla $DOMAIN (redirect)..."

APEX_CF_CONFIG=$(cat <<EOF
{
    "CallerReference": "apex-praca-magisterska-$(date +%Y%m%d%H%M%S)",
    "Aliases": {
        "Quantity": 1,
        "Items": ["$DOMAIN"]
    },
    "DefaultRootObject": "",
    "Origins": {
        "Quantity": 1,
        "Items": [{
            "Id": "S3-$DOMAIN",
            "DomainName": "$DOMAIN.s3-website.$REGION.amazonaws.com",
            "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only",
                "OriginSslProtocols": {"Quantity": 1, "Items": ["TLSv1.2"]},
                "OriginReadTimeout": 30,
                "OriginKeepaliveTimeout": 5
            }
        }]
    },
    "DefaultCacheBehavior": {
        "TargetOriginId": "S3-$DOMAIN",
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 2,
            "Items": ["HEAD", "GET"],
            "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
        },
        "Compress": true,
        "ForwardedValues": {
            "QueryString": false,
            "Cookies": {"Forward": "none"}
        },
        "MinTTL": 0,
        "DefaultTTL": 86400,
        "MaxTTL": 31536000
    },
    "Comment": "praca-magisterska.pl - redirect to www",
    "Enabled": true,
    "ViewerCertificate": {
        "ACMCertificateArn": "$CERT_ARN",
        "SSLSupportMethod": "sni-only",
        "MinimumProtocolVersion": "TLSv1.2_2021"
    },
    "PriceClass": "PriceClass_100",
    "HttpVersion": "http2",
    "IsIPV6Enabled": true
}
EOF
)

APEX_CF_RESULT=$(aws cloudfront create-distribution \
    --distribution-config "$APEX_CF_CONFIG" \
    --output json 2>&1) || true

if echo "$APEX_CF_RESULT" | grep -q "DistributionAlreadyExists\|CNAMEAlreadyExists"; then
    echo "Dystrybucja apex już istnieje"
    APEX_CF_DOMAIN=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?contains(Aliases.Items, '$DOMAIN')].DomainName" \
        --output text)
else
    APEX_CF_DOMAIN=$(echo "$APEX_CF_RESULT" | grep -o '"DomainName": "[^"]*"' | head -1 | cut -d'"' -f4)
fi

echo "✓ CloudFront apex: $APEX_CF_DOMAIN"

# ============================================
# KROK 8: Rekordy DNS Route53
# ============================================
echo ""
echo "[8/8] Konfiguracja DNS Route53..."

# CloudFront hosted zone ID (stała dla wszystkich dystrybucji CF)
CF_HOSTED_ZONE_ID="Z2FDTNDATAQYW2"

aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch '{
        "Changes": [
            {
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "'"$DOMAIN"'",
                    "Type": "A",
                    "AliasTarget": {
                        "HostedZoneId": "'"$CF_HOSTED_ZONE_ID"'",
                        "DNSName": "'"$APEX_CF_DOMAIN"'",
                        "EvaluateTargetHealth": false
                    }
                }
            },
            {
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "'"$WWW_DOMAIN"'",
                    "Type": "A",
                    "AliasTarget": {
                        "HostedZoneId": "'"$CF_HOSTED_ZONE_ID"'",
                        "DNSName": "'"$WWW_CF_DOMAIN"'",
                        "EvaluateTargetHealth": false
                    }
                }
            }
        ]
    }' > /dev/null

echo "✓ Rekordy DNS skonfigurowane"

# ============================================
# PODSUMOWANIE
# ============================================
echo ""
echo "=========================================="
echo "INFRASTRUKTURA GOTOWA!"
echo "=========================================="
echo ""
echo "Buckety S3:"
echo "  - $WWW_DOMAIN (hosting)"
echo "  - $DOMAIN (redirect → www)"
echo ""
echo "CloudFront:"
echo "  - www: $WWW_CF_DOMAIN"
echo "  - apex: $APEX_CF_DOMAIN"
echo ""
echo "Certyfikat: $CERT_ARN"
echo ""
echo "=========================================="
echo "NASTĘPNY KROK - DEPLOY PLIKÓW:"
echo "=========================================="
echo ""
echo "1. Zbuduj projekt Astro:"
echo "   cd $PROJECT_PATH"
echo "   npm run build"
echo ""
echo "2. Wyślij pliki na S3:"
echo "   aws s3 sync dist/ s3://$WWW_DOMAIN --delete"
echo ""
echo "3. Invalidacja cache CloudFront:"
echo "   aws cloudfront create-invalidation --distribution-id <WWW_DISTRIBUTION_ID> --paths '/*'"
echo ""
echo "=========================================="