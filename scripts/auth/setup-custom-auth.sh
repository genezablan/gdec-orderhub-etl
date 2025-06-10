#!/bin/bash

# Custom Authentication Setup for Cognito
# This script creates Lambda functions and configures Cognito User Pool triggers

set -e

# Configuration
REGION="${AWS_COGNITO_REGION:-ap-southeast-1}"
USER_POOL_ID="${AWS_COGNITO_USER_POOL_ID}"
FROM_EMAIL="noreply@greatdealscorp.com"
FUNCTION_PREFIX="gdec-cognito-auth"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Custom Authentication for Cognito User Pool${NC}"
echo "Region: $REGION"
echo "User Pool ID: $USER_POOL_ID"
echo "From Email: $FROM_EMAIL"

# Check if User Pool ID is set
if [ -z "$USER_POOL_ID" ]; then
    echo -e "${RED}Error: AWS_COGNITO_USER_POOL_ID environment variable is not set${NC}"
    exit 1
fi

# Create IAM role for Lambda functions
echo -e "${YELLOW}Creating IAM role for Lambda functions...${NC}"

ROLE_NAME="${FUNCTION_PREFIX}-lambda-role"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}'

# Create role if it doesn't exist
if ! aws iam get-role --role-name $ROLE_NAME 2>/dev/null; then
    aws iam create-role \
        --role-name $ROLE_NAME \
        --assume-role-policy-document "$TRUST_POLICY" \
        --description "Role for Cognito Custom Auth Lambda functions"
fi

# Attach policies
aws iam attach-role-policy \
    --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for SES
SES_POLICY='{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    }
  ]
}'

SES_POLICY_NAME="${FUNCTION_PREFIX}-ses-policy"
aws iam put-role-policy \
    --role-name $ROLE_NAME \
    --policy-name $SES_POLICY_NAME \
    --policy-document "$SES_POLICY"

# Get the role ARN
ROLE_ARN=$(aws iam get-role --role-name $ROLE_NAME --query 'Role.Arn' --output text)
echo "Role ARN: $ROLE_ARN"

# Wait for role to be available
echo -e "${YELLOW}Waiting for IAM role to propagate...${NC}"
sleep 10

# Function to create Lambda function
create_lambda_function() {
    local function_name=$1
    local handler=$2
    local description=$3
    local source_file=$4
    
    echo -e "${YELLOW}Creating Lambda function: $function_name${NC}"
    
    # Save current directory
    CURRENT_DIR=$(pwd)
    
    # Create zip file in the cognito-custom-auth directory
    cd scripts/cognito-custom-auth
    
    # Verify file exists and has content
    if [ ! -f "$source_file" ]; then
        echo -e "${RED}Error: Source file $source_file not found${NC}"
        cd "$CURRENT_DIR"
        return 1
    fi
    
    # Check file size
    FILE_SIZE=$(stat -c%s "$source_file")
    if [ $FILE_SIZE -eq 0 ]; then
        echo -e "${RED}Error: Source file $source_file is empty${NC}"
        cd "$CURRENT_DIR"
        return 1
    fi
    
    echo "Creating zip with file: $source_file (size: $FILE_SIZE bytes)"
    
    # Remove existing zip if it exists
    [ -f "${function_name}.zip" ] && rm "${function_name}.zip"
    
    # Create zip file
    zip "${function_name}.zip" "$source_file"
    
    # Verify zip was created and has content
    if [ ! -f "${function_name}.zip" ]; then
        echo -e "${RED}Error: Failed to create zip file${NC}"
        cd "$CURRENT_DIR"
        return 1
    fi
    
    ZIP_SIZE=$(stat -c%s "${function_name}.zip")
    echo "Zip file created: ${function_name}.zip (size: $ZIP_SIZE bytes)"
    
    # Delete function if it exists
    if aws lambda get-function --function-name $function_name 2>/dev/null; then
        echo "Function exists, deleting..."
        aws lambda delete-function --function-name $function_name
        sleep 5
    fi
    
    # Create function
    aws lambda create-function \
        --function-name $function_name \
        --runtime nodejs18.x \
        --role $ROLE_ARN \
        --handler $handler \
        --description "$description" \
        --zip-file fileb://${function_name}.zip \
        --environment Variables="{FROM_EMAIL=$FROM_EMAIL}" \
        --timeout 30
    
    # Clean up zip file
    rm ${function_name}.zip
    cd "$CURRENT_DIR"
    
    echo -e "${GREEN}Created function: $function_name${NC}"
}

# Create Lambda functions
create_lambda_function \
    "${FUNCTION_PREFIX}-define-auth-challenge" \
    "define-auth-challenge.handler" \
    "Define Auth Challenge for Custom Authentication" \
    "define-auth-challenge.js"

create_lambda_function \
    "${FUNCTION_PREFIX}-create-auth-challenge" \
    "create-auth-challenge.handler" \
    "Create Auth Challenge for Custom Authentication" \
    "create-auth-challenge.js"

create_lambda_function \
    "${FUNCTION_PREFIX}-verify-auth-challenge-response" \
    "verify-auth-challenge-response.handler" \
    "Verify Auth Challenge Response for Custom Authentication" \
    "verify-auth-challenge-response.js"

# Add permissions for Cognito to invoke Lambda functions
echo -e "${YELLOW}Adding Cognito permissions to Lambda functions...${NC}"

aws lambda add-permission \
    --function-name "${FUNCTION_PREFIX}-define-auth-challenge" \
    --statement-id "AllowCognitoInvoke" \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "arn:aws:cognito-idp:${REGION}:$(aws sts get-caller-identity --query Account --output text):userpool/${USER_POOL_ID}" || true

aws lambda add-permission \
    --function-name "${FUNCTION_PREFIX}-create-auth-challenge" \
    --statement-id "AllowCognitoInvoke" \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "arn:aws:cognito-idp:${REGION}:$(aws sts get-caller-identity --query Account --output text):userpool/${USER_POOL_ID}" || true

aws lambda add-permission \
    --function-name "${FUNCTION_PREFIX}-verify-auth-challenge-response" \
    --statement-id "AllowCognitoInvoke" \
    --action lambda:InvokeFunction \
    --principal cognito-idp.amazonaws.com \
    --source-arn "arn:aws:cognito-idp:${REGION}:$(aws sts get-caller-identity --query Account --output text):userpool/${USER_POOL_ID}" || true

# Update Cognito User Pool to use Lambda triggers
echo -e "${YELLOW}Updating Cognito User Pool with Lambda triggers...${NC}"

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

aws cognito-idp update-user-pool \
    --user-pool-id $USER_POOL_ID \
    --lambda-config DefineAuthChallenge="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_PREFIX}-define-auth-challenge",CreateAuthChallenge="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_PREFIX}-create-auth-challenge",VerifyAuthChallengeResponse="arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:${FUNCTION_PREFIX}-verify-auth-challenge-response"

echo -e "${GREEN}Custom Authentication setup completed!${NC}"
echo ""
echo "Lambda functions created:"
echo "  - ${FUNCTION_PREFIX}-define-auth-challenge"
echo "  - ${FUNCTION_PREFIX}-create-auth-challenge"
echo "  - ${FUNCTION_PREFIX}-verify-auth-challenge-response"
echo ""
echo "User Pool ID: $USER_POOL_ID"
echo "Triggers configured successfully!"
echo ""
echo -e "${YELLOW}Note: Make sure the FROM_EMAIL ($FROM_EMAIL) is verified in AWS SES${NC}"
