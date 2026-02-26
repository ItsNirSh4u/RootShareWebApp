import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '@rootshare/shared-types';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  const createMockExecutionContext = (user: any): ExecutionContext => {
    const mockRequest = { user };

    return {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true if no roles are required', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const context = createMockExecutionContext({ id: '1', role: UserRole.USER });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true if user has required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        id: '1',
        role: UserRole.ADMIN,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user does not have required role', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext({
        id: '1',
        role: UserRole.USER,
      });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if user is not authenticated', () => {
      reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
      const context = createMockExecutionContext(null);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should return true if user has one of multiple required roles', () => {
      reflector.getAllAndOverride.mockReturnValue([
        UserRole.ADMIN,
        UserRole.USER,
      ]);
      const context = createMockExecutionContext({
        id: '1',
        role: UserRole.USER,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
