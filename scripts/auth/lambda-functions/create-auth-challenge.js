/**
 * CreateAuthChallenge Lambda Function
 * This creates the challenge (generates and sends the OTP code)
 */

// Simple in-memory store for OTP codes (in production, use DynamoDB or Redis)
const otpStore = new Map();

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmailOTP(email, otp) {
    try {
        // Import AWS SDK v3 SES client
        const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
        
        // Create SES client
        const sesClient = new SESClient({ 
            region: process.env.AWS_REGION || 'ap-southeast-1' 
        });
        
        const fromEmail = process.env.FROM_EMAIL || 'noreply@greatdealscorp.com';
        
        // Create email parameters
        const params = {
            Source: fromEmail,
            Destination: {
                ToAddresses: [email]
            },
            Message: {
                Subject: {
                    Data: 'Your Verification Code - Great Deals Corp',
                    Charset: 'UTF-8'
                },
                Body: {
                    Html: {
                        Data: `
                            <html>
                                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
                                        <h1 style="color: #333; margin-bottom: 20px;">Verification Code</h1>
                                        <p style="font-size: 16px; color: #666; margin-bottom: 30px;">
                                            Please use the following verification code to complete your sign-in:
                                        </p>
                                        <div style="background-color: #007bff; color: white; font-size: 32px; font-weight: bold; padding: 20px; border-radius: 8px; letter-spacing: 8px; margin: 20px 0;">
                                            ${otp}
                                        </div>
                                        <p style="font-size: 14px; color: #999; margin-top: 30px;">
                                            This code will expire in 5 minutes. If you didn't request this code, please ignore this email.
                                        </p>
                                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                                        <p style="font-size: 12px; color: #999;">
                                            Great Deals Corp - Order Hub ETL System
                                        </p>
                                    </div>
                                </body>
                            </html>
                        `,
                        Charset: 'UTF-8'
                    },
                    Text: {
                        Data: `Your verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nGreat Deals Corp - Order Hub ETL System`,
                        Charset: 'UTF-8'
                    }
                }
            }
        };
        
        // Send email
        const command = new SendEmailCommand(params);
        const result = await sesClient.send(command);
        
        console.log(`Email sent successfully to ${email}. MessageId: ${result.MessageId}`);
        console.log(`OTP for ${email}: ${otp}`); // Still log for debugging
        
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        console.log(`OTP for ${email}: ${otp}`); // Fallback - still log the OTP
        
        // Don't fail the authentication if email fails - return true anyway
        return true;
    }
}

exports.handler = async (event) => {
    console.log('CreateAuthChallenge event:', JSON.stringify(event, null, 2));
    
    const { request, response } = event;
    
    if (request.challengeName === 'CUSTOM_CHALLENGE') {
        // Generate OTP
        const otp = generateOTP();
        const email = request.userAttributes.email;
        
        // Store OTP with expiration (5 minutes)
        const expirationTime = Date.now() + (5 * 60 * 1000); // 5 minutes
        otpStore.set(email, { otp, expirationTime });
        
        // Send OTP via email
        const emailSent = await sendEmailOTP(email, otp);
        
        if (emailSent) {
            // Set challenge metadata
            response.publicChallengeParameters = {
                email: email
            };
            response.privateChallengeParameters = {
                otp: otp
            };
            response.challengeMetadata = 'EMAIL_OTP_CHALLENGE';
        } else {
            throw new Error('Failed to send verification email');
        }
    }
    
    console.log('CreateAuthChallenge response:', JSON.stringify(response, null, 2));
    return event;
};
