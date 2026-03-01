import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthProvider, UserRole, IUser } from '@rootshare/shared-types';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

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

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  };

  const mockAuthResponse = {
    user: mockUser,
    tokens: mockTokens,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: jest.fn(),
            login: jest.fn(),
            refreshTokens: jest.fn(),
            logout: jest.fn(),
            validateGoogleUser: jest.fn(),
            validateGoogleIdToken: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('http://localhost:5173'),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
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

    it('should register a new user', async () => {
      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'Password123',
    };

    it('should login user', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('refresh', () => {
    it('should refresh tokens with refresh token from request', async () => {
      const mockRequest = { user: { sub: 'user-id-123', refreshToken: 'valid-refresh-token' } };
      authService.refreshTokens.mockResolvedValue(mockTokens);

      const result = await controller.refresh(mockRequest as any);

      expect(authService.refreshTokens).toHaveBeenCalledWith('user-id-123', 'valid-refresh-token');
      expect(result).toEqual(mockTokens);
    });
  });

  describe('logout', () => {
    it('should logout user and return success message', async () => {
      const mockRequest = { user: { id: 'user-id-123' } };

      const result = await controller.logout(mockRequest as any);

      expect(authService.logout).toHaveBeenCalledWith('user-id-123');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user from request', async () => {
      const mockRequest = { user: mockUser };

      const result = await controller.getCurrentUser(mockRequest as any);

      expect(result).toEqual(mockUser);
    });
  });

  describe('googleAuth', () => {
    it('should be defined (guard handles the redirect)', async () => {
      expect(controller.googleAuth).toBeDefined();
    });
  });

  describe('googleAuthCallback', () => {
    it('should redirect to frontend with tokens', async () => {
      const mockRequest = {
        user: {
          googleId: 'google-123',
          email: 'google@example.com',
          firstName: 'John',
          lastName: 'Doe',
        },
      };
      const mockResponse = {
        redirect: jest.fn(),
      };

      authService.validateGoogleUser.mockResolvedValue(mockAuthResponse);

      await controller.googleAuthCallback(mockRequest, mockResponse as any);

      expect(authService.validateGoogleUser).toHaveBeenCalledWith(
        mockRequest.user,
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:5173/auth/callback'),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('accessToken=mock-access-token'),
      );
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('refreshToken=mock-refresh-token'),
      );
    });
  });

  describe('googleTokenAuth', () => {
    it('should exchange Google ID token for app tokens', async () => {
      const idToken = 'google-id-token';
      authService.validateGoogleIdToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.googleTokenAuth(idToken);

      expect(authService.validateGoogleIdToken).toHaveBeenCalledWith(idToken);
      expect(result).toEqual(mockAuthResponse);
    });
  });
});
