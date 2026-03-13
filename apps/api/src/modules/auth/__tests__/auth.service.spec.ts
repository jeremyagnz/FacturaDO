import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { User, UserRole, UserStatus } from '../user.entity';
import { RefreshToken } from '../refresh-token.entity';

const mockUserRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockRefreshTokenRepository = {
  findOne: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, defaultValue?: unknown) => {
    const config: Record<string, unknown> = {
      'jwt.accessSecret': 'test-secret',
      'jwt.refreshSecret': 'test-refresh-secret',
      'jwt.accessExpiresIn': '15m',
      'jwt.refreshExpiresIn': '7d',
    };
    return config[key] ?? defaultValue;
  }),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
        { provide: getRepositoryToken(RefreshToken), useValue: mockRefreshTokenRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue({
        id: 'uuid-1',
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashed',
        status: UserStatus.PENDING,
      });
      mockUserRepository.save.mockResolvedValue({
        id: 'uuid-1',
        name: 'Test User',
        email: 'test@example.com',
        status: UserStatus.PENDING,
      });

      const result = await service.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(mockUserRepository.save).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictException if email already exists', async () => {
      mockUserRepository.findOne.mockResolvedValue({ email: 'test@example.com' });

      await expect(
        service.register({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 12);

      mockUserRepository.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        passwordHash,
        role: UserRole.VIEWER,
        status: UserStatus.ACTIVE,
        companies: [],
      });

      mockRefreshTokenRepository.create.mockReturnValue({
        token: 'mock-refresh-token',
        expiresAt: new Date(),
        userId: 'uuid-1',
      });
      mockRefreshTokenRepository.save.mockResolvedValue({});
      mockUserRepository.update.mockResolvedValue({});

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password123!',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
    });

    it('should throw UnauthorizedException with invalid credentials', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.login({ email: 'bad@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      const passwordHash = await bcrypt.hash('Password123!', 12);
      mockUserRepository.findOne.mockResolvedValue({
        id: 'uuid-1',
        email: 'test@example.com',
        passwordHash,
        status: UserStatus.INACTIVE,
        companies: [],
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'Password123!' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
