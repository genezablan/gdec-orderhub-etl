import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  UseGuards, 
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService, PasswordlessSignInDto, VerifyCodeDto, AuthResult } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { User } from './decorators/user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('passwordless/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initiate passwordless sign-in' })
  @ApiResponse({ status: 200, description: 'Verification code sent to email' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async initiatePasswordlessSignIn(
    @Body() signInDto: PasswordlessSignInDto
  ): Promise<{ message: string; session?: string }> {
    return this.authService.initiatePasswordlessSignIn(signInDto);
  }

  @Public()
  @Post('passwordless/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify passwordless code and sign in' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated' })
  @ApiResponse({ status: 401, description: 'Invalid or expired code' })
  async verifyPasswordlessCode(
    @Body() verifyDto: VerifyCodeDto
  ): Promise<AuthResult> {
    return this.authService.verifyPasswordlessCode(verifyDto);
  }

  @Public()
  @Post('passwordless/resend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend verification code' })
  @ApiResponse({ status: 200, description: 'Verification code resent' })
  @ApiResponse({ status: 400, description: 'Failed to resend code' })
  async resendVerificationCode(
    @Body() body: { email: string }
  ): Promise<{ message: string }> {
    return this.authService.resendVerificationCode(body.email);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Body() body: { refreshToken: string }
  ): Promise<AuthResult> {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@User() user: any): Promise<any> {
    return {
      user,
      message: 'Profile retrieved successfully',
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({ status: 200, description: 'User information retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req: any): Promise<any> {
    const accessToken = req.headers.authorization?.split(' ')[1];
    if (!accessToken) {
      throw new Error('No access token provided');
    }
    
    return this.authService.getUserInfo(accessToken);
  }

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Health check for auth service' })
  @ApiResponse({ status: 200, description: 'Auth service is healthy' })
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
