#!/bin/bash
# deploy-get-download.sh
# Deploy nowej Lambda get-download + routing w API Gateway
set -e

REGION="eu-central-1"
FUNCTION_NAME="praca-magisterska-get-download"
ROLE_ARN="arn:aws:iam::381492300277:role/praca-magisterska-sklep-lambda-role"
API_ID="kiv8tougqc"
DEPLOY_DIR=".deploy-tmp"

echo "=== Deploying get-download Lambda ==="

mkdir -p "$DEPLOY_DIR"

# 1. Build and zip
cd aws-lambda/get-download
npm install --production
zip -r "../../${DEPLOY_DIR}/get-download.zip" .
cd ../..

# 2. Create or update Lambda
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null; then
    echo "Updating existing Lambda..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --region "$REGION" \
        --zip-file "fileb://${DEPLOY_DIR}/get-download.zip"
else
    echo "Creating new Lambda..."
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "nodejs22.x" \
        --role "$ROLE_ARN" \
        --handler "index.handler" \
        --zip-file "fileb://${DEPLOY_DIR}/get-download.zip" \
        --timeout 30 \
        --memory-size 256 \
        --region "$REGION" \
        --environment "Variables={STRIPE_SECRET_KEY=USTAW_RECZNIE,S3_BUCKET=praca-magisterska-ebooks}"
fi

echo "Waiting for Lambda to be ready..."
aws lambda wait function-active-v2 --function-name "$FUNCTION_NAME" --region "$REGION" 2>/dev/null || sleep 5

# 3. Add API Gateway permission
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "apigateway-invoke-get-download" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "arn:aws:execute-api:${REGION}:381492300277:${API_ID}/*" \
    --region "$REGION" 2>/dev/null || true

# 4. Create API Gateway integration
INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --region "$REGION" \
    --query "Items[?contains(IntegrationUri, '${FUNCTION_NAME}')].IntegrationId" --output text)

if [ -z "$INTEGRATION_ID" ] || [ "$INTEGRATION_ID" = "None" ]; then
    echo "Creating API Gateway integration..."
    INTEGRATION_ID=$(aws apigatewayv2 create-integration \
        --api-id "$API_ID" \
        --integration-type AWS_PROXY \
        --integration-uri "arn:aws:lambda:${REGION}:381492300277:function:${FUNCTION_NAME}" \
        --payload-format-version "2.0" \
        --region "$REGION" \
        --query "IntegrationId" --output text)
    echo "Integration ID: $INTEGRATION_ID"
fi

# 5. Create route
aws apigatewayv2 create-route \
    --api-id "$API_ID" \
    --route-key "POST /get-download" \
    --target "integrations/${INTEGRATION_ID}" \
    --region "$REGION" 2>/dev/null || echo "Route already exists"

echo ""
echo "=== DONE ==="
echo "Endpoint: https://${API_ID}.execute-api.${REGION}.amazonaws.com/prod/get-download"
echo ""
echo "WAŻNE: Ustaw STRIPE_SECRET_KEY w Lambda:"
echo "  aws lambda update-function-configuration --function-name $FUNCTION_NAME --region $REGION --environment \"Variables={STRIPE_SECRET_KEY=WKLEJ_KLUCZ,S3_BUCKET=praca-magisterska-ebooks}\""
