#!/bin/bash

# AWS Cognito User Pool Setup Script for Passwordless Authentication
# This script creates a new Cognito User Pool optimized for passwordless auth

set -e  # Exit on any error

echo "🚀 Setting up NEW AWS Cognito User Pool for Passwordless Authentication..."
echo "=================================================================="

# Configuration variables
POOL_NAME="gdec-orderhub-passwordless-pool"
CLIENT_NAME="gdec-orderhub-passwordless-client"
REGION="ap-southeast-1"

# Check if AWS CLI is configured
echo "1. Checking AWS CLI configuration..."
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' or check your ~/.aws/credentials file"
    exit 1
fi

echo "✅ AWS CLI is configured"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "   Account ID: $ACCOUNT_ID"
echo "   Region: $REGION"
echo ""

# Delete existing pool if it exists
echo "2. Checking for existing User Pool..."
EXISTING_POOL=$(aws cognito-idp list-user-pools --max-items 60 --region $REGION --query "UserPools[?Name=='$POOL_NAME'].Id" --output text 2>/dev/null || echo "")

if [ ! -z "$EXISTING_POOL" ]; then
    echo "   Found existing pool: $EXISTING_POOL"
    echo "   Deleting existing pool..."
    aws cognito-idp delete-user-pool --user-pool-id $EXISTING_POOL --region $REGION
    echo "   ✅ Existing pool deleted"
    sleep 2
fi

# Step 1: Create User Pool for Passwordless Authentication
echo "3. Creating new User Pool for passwordless authentication..."
USER_POOL_OUTPUT=$(aws cognito-idp create-user-pool \
    --pool-name "$POOL_NAME" \
    --auto-verified-attributes email \
    --username-attributes email \
    --policies '{
        "PasswordPolicy": {
            "MinimumLength": 8,
            "RequireUppercase": false,
            "RequireLowercase": false,
            "RequireNumbers": false,
            "RequireSymbols": false
        }
    }' \
    --email-configuration '{
        "EmailSendingAccount": "COGNITO_DEFAULT"
    }' \
    --verification-message-template '{
        "DefaultEmailOption": "CONFIRM_WITH_CODE",
        "EmailMessage": "Your verification code for GDEC OrderHub is {####}. This code expires in 10 minutes.",
        "EmailSubject": "GDEC OrderHub - Verification Code"
    }' \
    --account-recovery-setting '{
        "RecoveryMechanisms": [
            {
                "Name": "verified_email",
                "Priority": 1
            }
        ]
    }' \
    --user-pool-tags '{
        "Environment": "development",
        "Project": "gdec-orderhub-etl",
        "AuthType": "passwordless"
    }' \
    --region $REGION \
    --output json)

if [ $? -eq 0 ]; then
    USER_POOL_ID=$(echo $USER_POOL_OUTPUT | jq -r '.UserPool.Id')
    echo "✅ User Pool created successfully!"
    echo "   User Pool ID: $USER_POOL_ID"
else
    echo "❌ Failed to create User Pool"
    exit 1
fi

echo ""

# Step 2: Create App Client for Passwordless Authentication
echo "4. Creating App Client for passwordless authentication..."
APP_CLIENT_OUTPUT=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$USER_POOL_ID" \
    --client-name "$CLIENT_NAME" \
    --no-generate-secret \
    --explicit-auth-flows ALLOW_CUSTOM_AUTH ALLOW_USER_SRP_AUTH ALLOW_REFRESH_TOKEN_AUTH \
    --supported-identity-providers COGNITO \
    --read-attributes email email_verified \
    --write-attributes email \
    --token-validity-units '{
        "AccessToken": "hours",
        "IdToken": "hours", 
        "RefreshToken": "days"
    }' \
    --access-token-validity 24 \
    --id-token-validity 24 \
    --refresh-token-validity 30 \
    --prevent-user-existence-errors ENABLED \
    --enable-token-revocation \
    --region $REGION \
    --output json)

if [ $? -eq 0 ]; then
    CLIENT_ID=$(echo $APP_CLIENT_OUTPUT | jq -r '.UserPoolClient.ClientId')
    echo "✅ App Client created successfully!"
    echo "   Client ID: $CLIENT_ID"
else
    echo "❌ Failed to create App Client"
    exit 1
fi

echo ""

# Step 3: Update .env configuration
echo "5. Updating .env configuration..."

# Create backup
if [ -f .env ]; then
    BACKUP_FILE=".env.backup.$(date +%Y%m%d_%H%M%S)"
    cp .env "$BACKUP_FILE"
    echo "   📁 Backup created: $BACKUP_FILE"
fi

# Update or add Cognito configuration
if [ -f .env ]; then
    # Update existing values
    sed -i "s/^AWS_COGNITO_USER_POOL_ID=.*/AWS_COGNITO_USER_POOL_ID=$USER_POOL_ID/" .env
    sed -i "s/^AWS_COGNITO_CLIENT_ID=.*/AWS_COGNITO_CLIENT_ID=$CLIENT_ID/" .env
    sed -i "s/^AWS_COGNITO_REGION=.*/AWS_COGNITO_REGION=$REGION/" .env
    
    # Add if not exists
    if ! grep -q "AWS_COGNITO_USER_POOL_ID" .env; then
        echo "AWS_COGNITO_USER_POOL_ID=$USER_POOL_ID" >> .env
    fi
    if ! grep -q "AWS_COGNITO_CLIENT_ID" .env; then
        echo "AWS_COGNITO_CLIENT_ID=$CLIENT_ID" >> .env
    fi
    if ! grep -q "AWS_COGNITO_REGION" .env; then
        echo "AWS_COGNITO_REGION=$REGION" >> .env
    fi
else
    # Create new .env file
    cat > .env << EOF
# AWS Cognito Configuration (Passwordless Auth)
AWS_COGNITO_REGION=$REGION
AWS_COGNITO_USER_POOL_ID=$USER_POOL_ID
AWS_COGNITO_CLIENT_ID=$CLIENT_ID
EOF
fi

echo "✅ .env file updated successfully!"

echo ""

# Step 4: Display summary
echo "🎉 Passwordless Authentication Setup Complete!"
echo "=============================================="
echo ""
echo "📋 Configuration Summary:"
echo "------------------------"
echo "User Pool ID:    $USER_POOL_ID"
echo "App Client ID:   $CLIENT_ID"
echo "Region:          $REGION"
echo "Pool Name:       $POOL_NAME"
echo "Client Name:     $CLIENT_NAME"
echo "Auth Type:       Passwordless (Email + Code)"
echo ""
echo "🔧 Updated .env variables:"
echo "-------------------------"
echo "AWS_COGNITO_USER_POOL_ID=$USER_POOL_ID"
echo "AWS_COGNITO_CLIENT_ID=$CLIENT_ID"
echo "AWS_COGNITO_REGION=$REGION"
echo ""
echo "📝 Next steps:"
echo "-------------"
echo "1. ✅ User Pool and App Client are created"
echo "2. ✅ .env file has been updated"
echo "3. 🔄 Restart your API Gateway:"
echo "   npm run start:api-gateway"
echo "4. 🧪 Test the passwordless authentication:"
echo "   curl -X POST http://localhost:3000/auth/passwordless/initiate \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"your-email@example.com\"}'"
echo ""
echo "🌐 AWS Console Links:"
echo "--------------------"
echo "User Pool: https://console.aws.amazon.com/cognito/v2/idp/user-pools/$USER_POOL_ID/users?region=$REGION"
echo "App Client: https://console.aws.amazon.com/cognito/v2/idp/user-pools/$USER_POOL_ID/app-integration/clients/$CLIENT_ID?region=$REGION"
echo ""
echo "✨ Passwordless authentication is ready!"
echo ""
echo "📧 How it works:"
echo "---------------"
echo "1. User enters email address"
echo "2. System sends verification code to email"
echo "3. User enters code to authenticate"
echo "4. System issues JWT tokens for authenticated session"
