import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { UsersService } from '../users/users.service';
import { IAuthResponse, IUserRegistration, IUserLogin, AuthProvider } from '@rootshare/shared-types';
import { GoogleProfile } from './strategies/google.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registrationData: IUserRegistration): Promise<IAuthResponse> {
    const existingUser = await this.usersService.findByEmail(registrationData.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    const user = await this.usersService.create({
      ...registrationData,
      password: hashedPassword,
    });

    const tokens = await this.generateTokens(user.id, user.email);

    // Store hashed refresh token in database
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return {
      user,
      tokens,
    };
  }

  async login(loginData: IUserLogin): Promise<IAuthResponse> {
    const user = await this.usersService.findByEmail(loginData.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.generateTokens(user._id.toString(), user.email);

    // Store hashed refresh token in database
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: this.usersService.sanitizeUser(user),
      tokens,
    };
  }

  async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Get user with refresh token from database
    const user = await this.usersService.findByIdWithRefreshToken(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }

    // Validate the refresh token against stored hash
    const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Access denied');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(user._id.toString(), user.email);

    // Store new hashed refresh token
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    // Delete refresh token from database
    await this.usersService.updateRefreshToken(userId, null);
  }

  async validateGoogleUser(googleProfile: GoogleProfile): Promise<IAuthResponse> {
    const { googleId, email, firstName, lastName, picture } = googleProfile;

    // Check if user already exists with this Google ID
    let user = await this.usersService.findByGoogleId(googleId);

    if (user) {
      // User exists, generate tokens
      const tokens = await this.generateTokens(user._id.toString(), user.email);

      // Store hashed refresh token
      await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

      return {
        user: this.usersService.sanitizeUser(user),
        tokens,
      };
    }

    // Check if user exists with this email (registered via local auth)
    const existingUserByEmail = await this.usersService.findByEmail(email);

    if (existingUserByEmail) {
      // Link Google account to existing user - throw error for security
      // User should login with password first and then link accounts
      throw new ConflictException(
        'An account with this email already exists. Please login with your password.',
      );
    }

    // Download Google profile image locally
    let localProfileImageUrl: string | undefined;
    if (picture) {
      localProfileImageUrl = await this.downloadProfileImage(picture, googleId);
    }

    // Create new user with Google OAuth
    const username = this.generateUniqueUsername(firstName, lastName);
    const newUser = await this.usersService.create({
      email,
      username,
      googleId,
      authProvider: AuthProvider.GOOGLE,
      profileImageUrl: localProfileImageUrl,
    });

    const tokens = await this.generateTokens(newUser.id, newUser.email);

    // Store hashed refresh token
    await this.storeRefreshToken(newUser.id, tokens.refreshToken);

    return {
      user: newUser,
      tokens,
    };
  }

  async validateGoogleIdToken(idToken: string): Promise<IAuthResponse> {
    // Verify the ID token with Google
    // For production, use google-auth-library's OAuth2Client.verifyIdToken()
    // This is a simplified implementation that decodes and validates the token
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');

    try {
      // Dynamically import google-auth-library to verify the token
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(googleClientId);

      const ticket = await client.verifyIdToken({
        idToken,
        audience: googleClientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Invalid Google ID token');
      }

      const googleProfile: GoogleProfile = {
        googleId: payload.sub,
        email: payload.email || '',
        firstName: payload.given_name || '',
        lastName: payload.family_name || '',
        picture: payload.picture,
      };

      return this.validateGoogleUser(googleProfile);
    } catch (error) {
      throw new UnauthorizedException('Invalid Google ID token');
    }
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }

  private async downloadProfileImage(imageUrl: string, uniqueId: string): Promise<string> {
    const uploadPath = this.configService.get<string>('UPLOAD_PATH') || './uploads';
    const profileImagesDir = path.join(uploadPath, 'profile-images');

    // Ensure directory exists
    if (!fs.existsSync(profileImagesDir)) {
      fs.mkdirSync(profileImagesDir, { recursive: true });
    }

    const fileExtension = '.jpg';
    const fileName = `${uniqueId}-${Date.now()}${fileExtension}`;
    const filePath = path.join(profileImagesDir, fileName);

    return new Promise((resolve, reject) => {
      const protocol = imageUrl.startsWith('https') ? https : http;
      const file = fs.createWriteStream(filePath);

      protocol.get(imageUrl, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            file.close();
            fs.unlinkSync(filePath);
            this.downloadProfileImage(redirectUrl, uniqueId)
              .then(resolve)
              .catch(reject);
            return;
          }
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          // Return relative URL path for serving
          resolve(`/uploads/profile-images/${fileName}`);
        });
      }).on('error', (err) => {
        fs.unlink(filePath, () => {}); // Delete partial file
        reject(err);
      });
    });
  }

  private generateUniqueUsername(firstName: string, lastName: string): string {
    const base = `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const randomSuffix = Math.floor(Math.random() * 10000);
    return `${base}${randomSuffix}`;
  }

  private async generateTokens(
    userId: string,
    email: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRATION'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION'),
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
