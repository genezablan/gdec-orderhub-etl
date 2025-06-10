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
      
      // For Cognito access tokens
      if (payload.token_use === 'access') {
        return {
          sub: payload.sub,
          username: payload.username,
          clientId: payload.client_id,
          cognito: true,
          scopes: payload.scope ? payload.scope.split(' ') : [],
        };
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
