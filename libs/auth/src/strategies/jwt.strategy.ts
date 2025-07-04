import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    const cognitoRegion = configService.get<string>('AWS_COGNITO_REGION') || 'ap-southeast-1';
    const cognitoUserPoolId = configService.get<string>('AWS_COGNITO_USER_POOL_ID') || 'ap-southeast-1_EspHylUJG';
    const cognitoClientId = configService.get<string>('AWS_COGNITO_CLIENT_ID') || 'tdb44tfpqp7heos7h2chn0ls5';

    console.log('JWT Strategy Config:', {
      cognitoRegion,
      cognitoUserPoolId,
      cognitoClientId,
      jwksUri: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}/.well-known/jwks.json`,
    });

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // audience: cognitoClientId, // Temporarily disable audience validation
      issuer: `https://cognito-idp.${cognitoRegion}.amazonaws.com/${cognitoUserPoolId}`,
      algorithms: ['RS256'],
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    try {
      console.log('JWT Payload received:', payload); // Debug log
      
      // For Cognito ID tokens (contains email and user profile)
      if (payload.token_use === 'id') {
        if (!payload.email) {
          throw new UnauthorizedException({
            message: 'ID token missing email field',
            error: 'Unauthorized',
            statusCode: 401,
            code: 'MISSING_EMAIL'
          });
        }
        
        return {
          sub: payload.sub,
          email: payload.email,
          username: payload['cognito:username'] || payload.username,
          firstName: payload.given_name,
          lastName: payload.family_name,
          clientId: payload.client_id,
          cognito: true,
          tokenType: 'id',
        };
      }
      
      // For Cognito access tokens (no email - should use ID tokens instead)
      if (payload.token_use === 'access') {
        console.warn('Access token received but ID token is required for user authentication. Please use ID token from frontend.');
        throw new UnauthorizedException({
          message: 'Invalid token type. Please use ID token for authentication.',
          error: 'Unauthorized',
          statusCode: 401,
          code: 'INVALID_TOKEN_TYPE',
          details: 'Access tokens do not contain user profile information. Use ID tokens for authentication.'
        });
      }

      // For other JWT tokens (if you have custom ones)
      return {
        sub: payload.sub,
        email: payload.email,
        username: payload.username,
      };
    } catch (error) {
      console.error('JWT validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
