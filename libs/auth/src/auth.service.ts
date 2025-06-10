import { Injectable, UnauthorizedException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  ResendConfirmationCodeCommand,
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  GetUserCommand,
  AuthFlowType,
  ChallengeNameType,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

export interface PasswordlessSignInDto {
  email: string;
}

export interface VerifyCodeDto {
  email: string;
  code: string;
  session?: string;
}

export interface AuthResult {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn: number;
  user: {
    email: string;
    sub: string;
    emailVerified: boolean;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private cognitoClient: CognitoIdentityProviderClient;
  private userPoolId: string;
  private clientId: string;
  private clientSecret?: string;
  // Remove password storage - we'll use proper passwordless authentication

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
  ) {
    const region = this.configService.get<string>('AWS_COGNITO_REGION');
    this.userPoolId = this.configService.get<string>('AWS_COGNITO_USER_POOL_ID') || '';
    this.clientId = this.configService.get<string>('AWS_COGNITO_CLIENT_ID') || '';
    this.clientSecret = this.configService.get<string>('AWS_COGNITO_CLIENT_SECRET');

    if (!this.userPoolId || !this.clientId) {
      throw new Error('AWS Cognito configuration is missing. Please check your environment variables.');
    }

    this.cognitoClient = new CognitoIdentityProviderClient({
      region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });

    this.logger.log(`Cognito client initialized for region: ${region}`);
  }

  /**
   * Generate HMAC for client secret if required
   */
  private generateSecretHash(username: string): string | undefined {
    if (!this.clientSecret) {
      return undefined;
    }
    
    const message = username + this.clientId;
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(message)
      .digest('base64');
  }

  /**
   * Initiate passwordless sign-in with email
   * Uses Cognito's custom authentication flow with Lambda triggers
   */
  async initiatePasswordlessSignIn(signInDto: PasswordlessSignInDto): Promise<{ message: string; session?: string }> {
    try {
      const { email } = signInDto;
      
      // Validate email domain first
      this.validateEmailDomain(email);
      
      this.logger.log(`Initiating passwordless sign-in for ${email}`);
      
      // First, ensure user exists
      await this.ensureUserExists(email);
      
      // Use custom authentication flow to trigger OTP generation
      const secretHash = this.generateSecretHash(email);
      
      const authParams: Record<string, string> = {
        USERNAME: email,
      };

      if (secretHash) {
        authParams.SECRET_HASH = secretHash;
      }

      const initiateAuthCommand = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.CUSTOM_AUTH,
        AuthParameters: authParams,
      });

      const response = await this.cognitoClient.send(initiateAuthCommand);
      
      this.logger.log(`Custom auth initiated for ${email}. Challenge: ${response.ChallengeName}`);
      
      if (response.ChallengeName === ChallengeNameType.CUSTOM_CHALLENGE) {
        return {
          message: 'Verification code sent to your email address. Please check your inbox.',
          session: response.Session,
        };
      }
      
      throw new BadRequestException('Unexpected challenge type received');
    } catch (error) {
      this.logger.error('Error initiating passwordless sign-in:', error);
      
      // Log more details about the error
      this.logger.error('Error details:', {
        name: error.name,
        message: error.message,
        code: error.$metadata?.httpStatusCode,
        requestId: error.$metadata?.requestId
      });
      
      if (error.name === 'UserNotFoundException') {
        throw new BadRequestException('User not found. Please contact support.');
      }
      if (error.name === 'InvalidParameterException') {
        throw new BadRequestException('Invalid email address.');
      }
      if (error.name === 'LimitExceededException') {
        throw new BadRequestException('Too many requests. Please try again later.');
      }
      if (error.name === 'NotAuthorizedException') {
        throw new BadRequestException('Authentication not authorized. Please check configuration.');
      }
      
      throw new BadRequestException(`Failed to initiate sign-in: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Ensure user exists in Cognito, create if they don't
   */
  private async ensureUserExists(email: string): Promise<void> {
    // Validate domain before creating user
    this.validateEmailDomain(email);
    
    this.logger.log(`Checking if user exists: ${email}`);
    
    try {
      // Use AdminGetUser to check if user exists
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
      });

      await this.cognitoClient.send(getUserCommand);
      this.logger.log(`User ${email} already exists`);
      
    } catch (error) {
      if (error.name === 'UserNotFoundException') {
        // User doesn't exist, create them
        this.logger.log(`User ${email} not found, creating...`);
        await this.createUserAndSendCode(email);
      } else {
        this.logger.error('Error checking user existence:', error);
        throw error;
      }
    }
  }

  /**
   * Send verification code to user's email
   */
  private async sendVerificationCode(email: string): Promise<void> {
    try {
      const secretHash = this.generateSecretHash(email);
      
      const command = new ResendConfirmationCodeCommand({
        ClientId: this.clientId,
        Username: email,
        SecretHash: secretHash,
      });

      await this.cognitoClient.send(command);
      this.logger.log(`Verification code sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending verification code:', error);
      throw error;
    }
  }

  /**
   * Create user and send verification code
   */
  private async createUserAndSendCode(email: string): Promise<void> {
    try {
      // Create user with temporary password
      const tempPassword = this.generateTemporaryPassword();
      
      const createUserCommand = new AdminCreateUserCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        UserAttributes: [
          {
            Name: 'email',
            Value: email,
          },
          {
            Name: 'email_verified',
            Value: 'true',
          },
        ],
        TemporaryPassword: tempPassword,
        MessageAction: 'SUPPRESS', // Don't send welcome email
      });

      await this.cognitoClient.send(createUserCommand);

      // Set permanent password
      const setPasswordCommand = new AdminSetUserPasswordCommand({
        UserPoolId: this.userPoolId,
        Username: email,
        Password: tempPassword,
        Permanent: true,
      });

      await this.cognitoClient.send(setPasswordCommand);

      this.logger.log(`User created successfully: ${email}`);
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw new BadRequestException('Failed to create user account');
    }
  }

  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Ensure password meets requirements
    return password + 'A1!';
  }

  /**
   * Verify the code sent to user's email for passwordless authentication
   */
  async verifyPasswordlessCode(verifyDto: VerifyCodeDto): Promise<AuthResult> {
    try {
      const { email, code, session } = verifyDto;
      
      // Validate email domain
      this.validateEmailDomain(email);
      
      this.logger.log(`Attempting to verify code for email: ${email}`);
      
      if (!session) {
        throw new BadRequestException('Session is required for code verification');
      }

      // Use RespondToAuthChallenge with the custom challenge
      const secretHash = this.generateSecretHash(email);
      
      const challengeResponses: Record<string, string> = {
        USERNAME: email,
        ANSWER: code,
      };

      if (secretHash) {
        challengeResponses.SECRET_HASH = secretHash;
      }

      const respondToAuthChallengeCommand = new RespondToAuthChallengeCommand({
        ClientId: this.clientId,
        ChallengeName: ChallengeNameType.CUSTOM_CHALLENGE,
        Session: session,
        ChallengeResponses: challengeResponses,
      });

      const authResponse = await this.cognitoClient.send(respondToAuthChallengeCommand);

      if (authResponse.AuthenticationResult) {
        const { AccessToken, RefreshToken, IdToken, ExpiresIn } = authResponse.AuthenticationResult;
        
        if (!AccessToken) {
          throw new UnauthorizedException('No access token received');
        }

        this.logger.log(`Authentication successful for ${email}`);

        // Get user information
        const userInfo = await this.getUserInfo(AccessToken);
        
        return {
          accessToken: AccessToken,
          refreshToken: RefreshToken,
          idToken: IdToken,
          expiresIn: ExpiresIn || 3600,
          user: {
            email: userInfo.email || email,
            sub: userInfo.sub || '',
            emailVerified: true,
          },
        };
      }

      throw new UnauthorizedException('Authentication failed after email verification');
    } catch (error) {
      this.logger.error('Error verifying code:', error);
      
      if (error.name === 'CodeMismatchException' || error.name === 'NotAuthorizedException') {
        throw new UnauthorizedException('Invalid verification code');
      }
      if (error.name === 'ExpiredCodeException') {
        throw new UnauthorizedException('Verification code has expired. Please request a new one.');
      }
      if (error.name === 'UserNotFoundException') {
        throw new UnauthorizedException('User not found. Please initiate sign-in again.');
      }
      
      throw new UnauthorizedException('Invalid or expired verification code');
    }
  }

  /**
   * Resend verification code
   */
  async resendVerificationCode(email: string): Promise<{ message: string }> {
    try {
      // For custom authentication, we need to initiate a new auth flow
      return await this.initiatePasswordlessSignIn({ email });
    } catch (error) {
      this.logger.error('Error resending verification code:', error);
      throw new BadRequestException('Failed to resend verification code');
    }
  }

  /**
   * Get user information from access token
   */
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const command = new GetUserCommand({
        AccessToken: accessToken,
      });

      const response = await this.cognitoClient.send(command);
      
      const userAttributes = response.UserAttributes?.reduce((acc, attr) => {
        if (attr.Name && attr.Value) {
          acc[attr.Name] = attr.Value;
        }
        return acc;
      }, {} as Record<string, string>) || {};

      return {
        sub: response.Username,
        ...userAttributes,
      };
    } catch (error) {
      this.logger.error('Error getting user info:', error);
      throw new UnauthorizedException('Invalid access token');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const authParameters: Record<string, string> = {
        REFRESH_TOKEN: refreshToken,
      };

      const command = new InitiateAuthCommand({
        ClientId: this.clientId,
        AuthFlow: AuthFlowType.REFRESH_TOKEN_AUTH,
        AuthParameters: authParameters,
      });

      const response = await this.cognitoClient.send(command);

      if (response.AuthenticationResult) {
        const { AccessToken, IdToken, ExpiresIn } = response.AuthenticationResult;
        
        if (!AccessToken) {
          throw new UnauthorizedException('No access token received');
        }

        const userInfo = await this.getUserInfo(AccessToken);
        
        return {
          accessToken: AccessToken,
          refreshToken, // Keep the same refresh token
          idToken: IdToken,
          expiresIn: ExpiresIn || 3600,
          user: {
            email: userInfo.email || '',
            sub: userInfo.sub || '',
            emailVerified: userInfo.email_verified === 'true',
          },
        };
      }

      throw new UnauthorizedException('Failed to refresh token');
    } catch (error) {
      this.logger.error('Error refreshing token:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<any> {
    try {
      return await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Validate that email belongs to allowed domain
   */
  private validateEmailDomain(email: string): void {
    const allowedDomainsConfig = this.configService.get<string>('ALLOWED_EMAIL_DOMAINS') || 'greatdealscorp.com';
    const allowedDomains = allowedDomainsConfig.split(',').map(domain => domain.trim().toLowerCase());
    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    if (!emailDomain || !allowedDomains.includes(emailDomain)) {
      this.logger.warn(`Access denied for email domain: ${emailDomain}. Allowed domains: ${allowedDomains.join(', ')}`);
      throw new UnauthorizedException(
        'Access restricted to authorized company domains only. Please use your company email address.'
      );
    }
    
    this.logger.log(`Email domain validated: ${emailDomain}`);
  }
}
