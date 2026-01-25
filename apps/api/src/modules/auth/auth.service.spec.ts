import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthProvider, UserRole, IUser } from '@rootshare/shared-types';

// Mock bcrypt before importing
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  createWriteStream: jest.fn().mockReturnValue({
    on: jest.fn(),
    close: jest.fn(),
  }),
  unlinkSync: jest.fn(),
  unlink: jest.fn(),
}));

jest.mock('https', () => ({
  get: jest.fn(),
}));

jest.mock('http', () => ({
  get: jest.fn(),
}));

// Import bcrypt after mocking
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser: IUser = {
    id: 'user-id-123',
    email: 'test@example.com',
    username: 'testuser',
    profileImageUrl: undefined,
    role: UserRole.USER,
    authProvider: AuthProvider.LOCAL,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithPassword = {
    ...mockUser,
    _id: { toString: () => 'user-id-123' },
    password: 'hashedPassword123',
    toObject: () => ({ ...mockUser, password: 'hashedPassword123' }),
  } as any;

  const mockUserWithRefreshToken = {
    ...mockUserWithPassword,
    refreshToken: 'hashedRefreshToken123',
  } as any;

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
            findByGoogleId: jest.fn(),
            findByIdWithRefreshToken: jest.fn(),
            updateRefreshToken: jest.fn(),
            updateProfileImage: jest.fn(),
            sanitizeUser: jest.fn().mockReturnValue(mockUser),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);

    // Setup default config values
    configService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRATION: '15m',
        JWT_REFRESH_EXPIRATION: '7d',
        GOOGLE_CLIENT_ID: 'google-client-id',
        UPLOAD_PATH: './uploads',
      };
      return config[key];
    });

    // Setup JWT signing
    jwtService.signAsync
      .mockResolvedValueOnce(mockTokens.accessToken)
      .mockResolvedValueOnce(mockTokens.refreshToken);

    // Setup bcrypt hash for refresh token storage
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedValue');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'Password123',
    };

    it('should register a new user and store refresh token', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).toHaveBeenCalled();
      expect(usersService.updateRefreshToken).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw ConflictException if user already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should login user and store refresh token', async () => {
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUserWithPassword.password,
      );
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens when valid refresh token provided', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue(mockUserWithRefreshToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.refreshTokens('user-id-123', 'valid-refresh-token');

      expect(usersService.findByIdWithRefreshToken).toHaveBeenCalledWith('user-id-123');
      expect(bcrypt.compare).toHaveBeenCalledWith('valid-refresh-token', 'hashedRefreshToken123');
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue(null);

      await expect(service.refreshTokens('invalid-id', 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if no refresh token stored', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue({
        ...mockUserWithPassword,
        refreshToken: null,
      });

      await expect(service.refreshTokens('user-id-123', 'token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if refresh token invalid', async () => {
      usersService.findByIdWithRefreshToken.mockResolvedValue(mockUserWithRefreshToken);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.refreshTokens('user-id-123', 'invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should delete refresh token from database', async () => {
      await service.logout('user-id-123');

      expect(usersService.updateRefreshToken).toHaveBeenCalledWith('user-id-123', null);
    });
  });

  describe('validateGoogleUser', () => {
    const googleProfile = {
      googleId: 'google-123',
      email: 'google@example.com',
      firstName: 'John',
      lastName: 'Doe',
      picture: undefined, // No picture to avoid file system mocking complexity
    };

    it('should return tokens for existing Google user', async () => {
      const existingGoogleUser = {
        ...mockUserWithPassword,
        googleId: 'google-123',
        authProvider: AuthProvider.GOOGLE,
      };
      usersService.findByGoogleId.mockResolvedValue(existingGoogleUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(usersService.findByGoogleId).toHaveBeenCalledWith('google-123');
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should create new user for new Google account', async () => {
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        ...mockUser,
        authProvider: AuthProvider.GOOGLE,
        googleId: 'google-123',
      });

      const result = await service.validateGoogleUser(googleProfile);

      expect(usersService.findByGoogleId).toHaveBeenCalledWith('google-123');
      expect(usersService.findByEmail).toHaveBeenCalledWith(googleProfile.email);
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: googleProfile.email,
          googleId: googleProfile.googleId,
          authProvider: AuthProvider.GOOGLE,
        }),
      );
      expect(usersService.updateRefreshToken).toHaveBeenCalled();
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
    });

    it('should throw ConflictException if email exists with local auth', async () => {
      usersService.findByGoogleId.mockResolvedValue(null);
      usersService.findByEmail.mockResolvedValue(mockUserWithPassword);

      await expect(service.validateGoogleUser(googleProfile)).rejects.toThrow(
        ConflictException,
      );
    });
  });
});
