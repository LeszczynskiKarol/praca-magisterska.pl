#!/bin/bash

# =============================================================================
# Deploy sklepu ebooków na AWS Lambda + API Gateway
# =============================================================================

set -e

# Konfiguracja - ZMIEŃ TE WARTOŚCI
REGION="eu-central-1"
SES_REGION="us-east-1"  # Region gdzie masz SES w trybie produkcyjnym
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
S3_BUCKET="praca-magisterska-ebooks"
LAMBDA_BUCKET="praca-magisterska-lambda-deploy"
API_NAME="praca-magisterska-sklep-api"
STAGE_NAME="prod"

# Zmienne Stripe - ustaw przed uruchomieniem lub jako env vars
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-sk_test_XXXXXXXX}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-whsec_XXXXXXXX}"

# Email settings - ZMIEŃ na zweryfikowaną domenę!
EMAIL_FROM="sklep@praca-magisterska.pl"
EMAIL_FROM_NAME="Praca-Magisterska.pl"

# URLs
SUCCESS_URL="https://www.praca-magisterska.pl/sklep/sukces"
CANCEL_URL="https://www.praca-magisterska.pl/sklep/anulowano"

echo "================================================"
echo "Deploying Praca-Magisterska.pl Ebook Store"
echo "Region: $REGION"
echo "Account: $ACCOUNT_ID"
echo "================================================"

# Utwórz lokalny katalog tymczasowy (kompatybilny z Windows)
TEMP_DIR="$(pwd)/.deploy-tmp"
mkdir -p "$TEMP_DIR"

# -----------------------------------------------------------------------------
# 1. Tworzenie S3 bucket na ebooki (jeśli nie istnieje)
# -----------------------------------------------------------------------------
echo ""
echo "[1/8] Creating S3 bucket for ebooks..."

if ! aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    aws s3api create-bucket \
        --bucket "$S3_BUCKET" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
    
    # Blokuj publiczny dostęp
    aws s3api put-public-access-block \
        --bucket "$S3_BUCKET" \
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    echo "✅ S3 bucket created: $S3_BUCKET"
else
    echo "✅ S3 bucket already exists: $S3_BUCKET"
fi

# -----------------------------------------------------------------------------
# 2. Tworzenie S3 bucket na deployment Lambd
# -----------------------------------------------------------------------------
echo ""
echo "[2/8] Creating S3 bucket for Lambda deployment..."

if ! aws s3api head-bucket --bucket "$LAMBDA_BUCKET" 2>/dev/null; then
    aws s3api create-bucket \
        --bucket "$LAMBDA_BUCKET" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
    echo "✅ Lambda deployment bucket created: $LAMBDA_BUCKET"
else
    echo "✅ Lambda deployment bucket already exists: $LAMBDA_BUCKET"
fi

# -----------------------------------------------------------------------------
# 3. Tworzenie IAM Role dla Lambda
# -----------------------------------------------------------------------------
echo ""
echo "[3/8] Creating IAM role for Lambda..."

ROLE_NAME="praca-magisterska-sklep-lambda-role"

# Trust policy jako string
TRUST_POLICY='{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}'

# Sprawdź czy rola istnieje
if ! aws iam get-role --role-name "$ROLE_NAME" 2>/dev/null; then
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY"
    
    echo "Waiting for role to propagate..."
    sleep 10
fi

# Policy dla Lambda jako string
LAMBDA_POLICY="{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"logs:CreateLogGroup\",\"logs:CreateLogStream\",\"logs:PutLogEvents\"],\"Resource\":\"arn:aws:logs:*:*:*\"},{\"Effect\":\"Allow\",\"Action\":[\"s3:GetObject\"],\"Resource\":\"arn:aws:s3:::${S3_BUCKET}/*\"},{\"Effect\":\"Allow\",\"Action\":[\"ses:SendEmail\",\"ses:SendRawEmail\"],\"Resource\":\"*\"}]}"

POLICY_NAME="praca-magisterska-sklep-lambda-policy"

# Usuń starą policy jeśli istnieje
aws iam delete-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" 2>/dev/null || true

# Dodaj nową policy
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document "$LAMBDA_POLICY"

ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"
echo "✅ IAM role configured: $ROLE_ARN"

# -----------------------------------------------------------------------------
# 4. Pakowanie i deploy Lambda: create-checkout
# -----------------------------------------------------------------------------
echo ""
echo "[4/8] Deploying create-checkout Lambda..."

cd aws-lambda/create-checkout
npm install --production
zip -r ${TEMP_DIR}/create-checkout.zip .
cd ../..

aws s3 cp ${TEMP_DIR}/create-checkout.zip "s3://${LAMBDA_BUCKET}/create-checkout.zip"

# Tworzenie lub aktualizacja funkcji
CHECKOUT_FUNCTION="praca-magisterska-create-checkout"

if aws lambda get-function --function-name "$CHECKOUT_FUNCTION" 2>/dev/null; then
    aws lambda update-function-code \
        --function-name "$CHECKOUT_FUNCTION" \
        --s3-bucket "$LAMBDA_BUCKET" \
        --s3-key "create-checkout.zip"
else
    aws lambda create-function \
        --function-name "$CHECKOUT_FUNCTION" \
        --runtime "nodejs20.x" \
        --role "$ROLE_ARN" \
        --handler "index.handler" \
        --code "S3Bucket=${LAMBDA_BUCKET},S3Key=create-checkout.zip" \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY},SUCCESS_URL=${SUCCESS_URL},CANCEL_URL=${CANCEL_URL}}"
fi

# Aktualizuj zmienne środowiskowe
aws lambda update-function-configuration \
    --function-name "$CHECKOUT_FUNCTION" \
    --environment "Variables={STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY},SUCCESS_URL=${SUCCESS_URL},CANCEL_URL=${CANCEL_URL}}" \
    > /dev/null

echo "✅ create-checkout Lambda deployed"

# -----------------------------------------------------------------------------
# 5. Pakowanie i deploy Lambda: webhook-handler
# -----------------------------------------------------------------------------
echo ""
echo "[5/8] Deploying webhook-handler Lambda..."

cd aws-lambda/webhook-handler
npm install --production
zip -r ${TEMP_DIR}/webhook-handler.zip .
cd ../..

aws s3 cp ${TEMP_DIR}/webhook-handler.zip "s3://${LAMBDA_BUCKET}/webhook-handler.zip"

WEBHOOK_FUNCTION="praca-magisterska-webhook-handler"

if aws lambda get-function --function-name "$WEBHOOK_FUNCTION" 2>/dev/null; then
    aws lambda update-function-code \
        --function-name "$WEBHOOK_FUNCTION" \
        --s3-bucket "$LAMBDA_BUCKET" \
        --s3-key "webhook-handler.zip"
else
    aws lambda create-function \
        --function-name "$WEBHOOK_FUNCTION" \
        --runtime "nodejs20.x" \
        --role "$ROLE_ARN" \
        --handler "index.handler" \
        --code "S3Bucket=${LAMBDA_BUCKET},S3Key=webhook-handler.zip" \
        --timeout 30 \
        --memory-size 256 \
        --environment "Variables={STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY},STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET},S3_BUCKET=${S3_BUCKET},EMAIL_FROM=${EMAIL_FROM},EMAIL_FROM_NAME=${EMAIL_FROM_NAME},SES_REGION=${SES_REGION}}"
fi

# Aktualizuj zmienne środowiskowe
aws lambda update-function-configuration \
    --function-name "$WEBHOOK_FUNCTION" \
    --environment "Variables={STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY},STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET},S3_BUCKET=${S3_BUCKET},EMAIL_FROM=${EMAIL_FROM},EMAIL_FROM_NAME=${EMAIL_FROM_NAME},SES_REGION=${SES_REGION}}" \
    > /dev/null

echo "✅ webhook-handler Lambda deployed"

# -----------------------------------------------------------------------------
# 6. Tworzenie API Gateway (HTTP API - tańsze)
# -----------------------------------------------------------------------------
echo ""
echo "[6/8] Creating API Gateway..."

# Sprawdź czy API już istnieje
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='${API_NAME}'].ApiId" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    API_ID=$(aws apigatewayv2 create-api \
        --name "$API_NAME" \
        --protocol-type HTTP \
        --cors-configuration "AllowOrigins=https://www.praca-magisterska.pl,AllowMethods=POST,OPTIONS,AllowHeaders=Content-Type" \
        --query "ApiId" --output text)
    echo "Created API: $API_ID"
fi

# Integracja dla create-checkout
CHECKOUT_INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" \
    --query "Items[?contains(IntegrationUri, 'create-checkout')].IntegrationId" --output text)

if [ -z "$CHECKOUT_INTEGRATION_ID" ] || [ "$CHECKOUT_INTEGRATION_ID" = "None" ]; then
    CHECKOUT_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id "$API_ID" \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${CHECKOUT_FUNCTION}" \
        --payload-format-version "2.0" \
        --query "IntegrationId" --output text)
fi

# Route dla create-checkout
aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /create-checkout" \
    --target "integrations/${CHECKOUT_INTEGRATION_ID}" 2>/dev/null || true

# Integracja dla webhook
WEBHOOK_INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" \
    --query "Items[?contains(IntegrationUri, 'webhook-handler')].IntegrationId" --output text)

if [ -z "$WEBHOOK_INTEGRATION_ID" ] || [ "$WEBHOOK_INTEGRATION_ID" = "None" ]; then
    WEBHOOK_INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id "$API_ID" \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${WEBHOOK_FUNCTION}" \
        --payload-format-version "2.0" \
        --query "IntegrationId" --output text)
fi

# Route dla webhook
aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /webhook" \
    --target "integrations/${WEBHOOK_INTEGRATION_ID}" 2>/dev/null || true

echo "✅ API Gateway configured: $API_ID"

# -----------------------------------------------------------------------------
# 7. Tworzenie Stage i deploy
# -----------------------------------------------------------------------------
echo ""
echo "[7/8] Deploying API Gateway stage..."

# Sprawdź czy stage istnieje
if ! aws apigatewayv2 get-stage --api-id "$API_ID" --stage-name "$STAGE_NAME" 2>/dev/null; then
    aws apigatewayv2 create-stage \
        --api-id "$API_ID" \
        --stage-name "$STAGE_NAME" \
        --auto-deploy
fi

# Dodaj permissions dla Lambda
aws lambda add-permission \
    --function-name "$CHECKOUT_FUNCTION" \
    --statement-id "apigateway-invoke-checkout" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" 2>/dev/null || true

aws lambda add-permission \
    --function-name "$WEBHOOK_FUNCTION" \
    --statement-id "apigateway-invoke-webhook" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:${REGION}:${ACCOUNT_ID}:${API_ID}/*" 2>/dev/null || true

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/${STAGE_NAME}"
echo "✅ API deployed to: $API_URL"

# -----------------------------------------------------------------------------
# 8. Podsumowanie
# -----------------------------------------------------------------------------
echo ""
echo "================================================"
echo "🎉 DEPLOYMENT COMPLETE!"
echo "================================================"
echo ""
echo "API Endpoints:"
echo "  POST ${API_URL}/create-checkout"
echo "  POST ${API_URL}/webhook"
echo ""
echo "Next steps:"
echo ""
echo "1. Upload ebooks to S3:"
echo "   aws s3 cp your-ebook.pdf s3://${S3_BUCKET}/ebooks/"
echo ""
echo "2. Configure Stripe webhook:"
echo "   URL: ${API_URL}/webhook"
echo "   Events: checkout.session.completed, checkout.session.async_payment_succeeded"
echo ""
echo "3. Verify email in SES:"
echo "   aws ses verify-email-identity --email-address ${EMAIL_FROM}"
echo ""
echo "4. Update your Astro site with API_URL:"
echo "   const API_URL = '${API_URL}'"
echo ""
echo "5. Test in Stripe test mode before going live!"
echo ""

# Zapisz konfigurację
cat > .env.production << EOF
# Generated by deploy-aws.sh
API_URL=${API_URL}
S3_BUCKET=${S3_BUCKET}
REGION=${REGION}
EOF

echo "Configuration saved to .env.production"

# Wyczyść katalog tymczasowy
rm -rf "$TEMP_DIR"
echo "Temporary files cleaned up."