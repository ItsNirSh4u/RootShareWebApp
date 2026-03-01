import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key: string) => {
              const config: Record<string, string> = {
                GOOGLE_CLIENT_ID: 'test-client-id',
                GOOGLE_CLIENT_SECRET: 'test-client-secret',
                GOOGLE_CALLBACK_URL: 'http://localhost:3000/api/auth/google/callback',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  describe('validate', () => {
    it('should return GoogleProfile from Google profile data', async () => {
      const mockGoogleProfile = {
        id: 'google-user-id-123',
        name: {
          givenName: 'Nitzan',
          familyName: 'Avargil',
        },
        emails: [{ value: 'nitzanavargil1@gmail.com', verified: true }],
        photos: [{ value: 'https://lh3.googleusercontent.com/photo.jpg' }],
      };

      const done = jest.fn();

      await strategy.validate(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, {
        googleId: 'google-user-id-123',
        email: 'nitzanavargil1@gmail.com',
        firstName: 'Nitzan',
        lastName: 'Avargil',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
      });
    });

    it('should handle missing optional fields', async () => {
      const mockGoogleProfile = {
        id: 'google-user-id-123',
        name: {},
        emails: [],
        photos: [],
      };

      const done = jest.fn();

      await strategy.validate(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, {
        googleId: 'google-user-id-123',
        email: '',
        firstName: '',
        lastName: '',
        picture: undefined,
      });
    });

    it('should handle undefined name field', async () => {
      const mockGoogleProfile = {
        id: 'google-user-id-123',
        emails: [{ value: 'test@gmail.com' }],
      };

      const done = jest.fn();

      await strategy.validate(
        'access-token',
        'refresh-token',
        mockGoogleProfile as any,
        done,
      );

      expect(done).toHaveBeenCalledWith(null, {
        googleId: 'google-user-id-123',
        email: 'test@gmail.com',
        firstName: '',
        lastName: '',
        picture: undefined,
      });
    });
  });
});
