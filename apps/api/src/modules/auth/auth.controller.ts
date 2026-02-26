import { Controller, Post, Body, UseGuards, Get, Request, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExcludeEndpoint } from '@nestjs/swagger';
import type { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthResponse } from '@rootshare/shared-types';
import { GoogleProfile } from './strategies/google.strategy';

interface RequestWithUser {
  user: {
    id: string;
    sub: string;
    refreshToken: string;
  };
}

interface GoogleCallbackRequest {
  user: GoogleProfile;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto): Promise<IAuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<IAuthResponse> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token successfully refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refresh(@Request() req: RequestWithUser): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'User successfully logged out' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(@Request() req: RequestWithUser): Promise<{ message: string }> {
    await this.authService.logout(req.user.id);
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(@Request() req: RequestWithUser): Promise<RequestWithUser['user']> {
    return req.user;
  }

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to Google OAuth' })
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  @ApiExcludeEndpoint()
  async googleAuthCallback(@Request() req: GoogleCallbackRequest, @Res() res: Response): Promise<void> {
    const result = await this.authService.validateGoogleUser(req.user);

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const redirectUrl = `${frontendUrl}/auth/callback?accessToken=${result.tokens.accessToken}&refreshToken=${result.tokens.refreshToken}`;

    res.redirect(redirectUrl);
  }

  @Post('google/token')
  @ApiOperation({ summary: 'Exchange Google ID token for app tokens (for mobile apps)' })
  @ApiResponse({ status: 200, description: 'Successfully authenticated with Google' })
  @ApiResponse({ status: 401, description: 'Invalid Google token' })
  async googleTokenAuth(@Body('idToken') idToken: string): Promise<IAuthResponse> {
    return this.authService.validateGoogleIdToken(idToken);
  }
}
