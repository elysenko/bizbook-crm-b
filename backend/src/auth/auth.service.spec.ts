import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { SignupDto } from './dto/signup.dto';
import { User } from 'src/user/entities/user.entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';

// Mock bcrypt entirely
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const mockPrismaService = {
  user: {
    create: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    count: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-token'),
};

describe('AuthService', () => {
  let authService: AuthService;
  let prisma: typeof mockPrismaService;
  let bcrypt: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    bcrypt = require('bcryptjs');
  });

  describe('signup', () => {
    const dto: SignupDto = {
      name: 'Test User',
      email: 'Test@Example.com',
      password: 'password123',
    };

    const created = {
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      role: 'admin',
      createdAt: new Date(),
    };

    it('assigns ADMIN to the first user', async () => {
      prisma.user.count.mockResolvedValue(0);
      prisma.user.create.mockResolvedValue(created);

      const result = await authService.signup(dto);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'admin' }) })
      );
      expect(result.user.role).toBe('ADMIN');
      expect(result.token).toBe('mock-token');
    });

    it('assigns USER to subsequent users', async () => {
      prisma.user.count.mockResolvedValue(3);
      prisma.user.create.mockResolvedValue({ ...created, role: 'user' });

      await authService.signup(dto);

      expect(prisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'user' }) })
      );
    });

    it('throws ConflictException on duplicate email', async () => {
      prisma.user.count.mockResolvedValue(1);
      prisma.user.create.mockRejectedValue(
        new PrismaClientKnownRequestError('exists', { code: 'P2002', clientVersion: '7' })
      );

      await expect(authService.signup(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('registerUser', () => {
    const registerDto: RegisterUserDto = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      passwordconf: 'password123',
      image: null,
    };

    const mockUser = {
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      image: null,
      role: 'user',
      createdAt: new Date(),
    };

    it('registers a user and returns API-shaped role', async () => {
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await authService.registerUser(registerDto);

      expect(result.user.role).toBe('USER');
      expect(result.token).toBe('mock-token');
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
    });

    it('throws BadRequestException if passwords do not match', async () => {
      const invalidDto = { ...registerDto, passwordconf: 'different' };
      await expect(authService.registerUser(invalidDto)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException if user already exists', async () => {
      prisma.user.create.mockRejectedValue(
        new PrismaClientKnownRequestError('Already exists', {
          code: 'P2002',
          clientVersion: '7',
        })
      );
      await expect(authService.registerUser(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('loginUser', () => {
    const email = 'test@example.com';
    const password = 'password123';

    const mockUser = {
      id: 'u1',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashed-password',
      image: null,
      role: 'user',
      createdAt: new Date(),
    };

    it('logs in a user and returns API-shaped user', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser });
      bcrypt.compare.mockResolvedValue(true);

      const result = await authService.loginUser(email, password);

      expect(result.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: 'USER',
        })
      );
      expect(result.user.password).toBeUndefined();
      expect(result.token).toBe('mock-token');
    });

    it('throws UnauthorizedException if user is not found', async () => {
      prisma.user.findUniqueOrThrow.mockRejectedValue(new Error());
      await expect(authService.loginUser(email, password)).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException if password is incorrect', async () => {
      prisma.user.findUniqueOrThrow.mockResolvedValue({ ...mockUser });
      bcrypt.compare.mockResolvedValue(false);
      await expect(authService.loginUser(email, password)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('returns a new token for the user', async () => {
      const mockUser: User = {
        id: '2313w49-0db7-4v79-aacc-52624343bf2t',
        name: 'Test User',
        email: 'test@example.com',
        image: null,
        role: 'user',
        createdAt: new Date(),
      };

      const result = await authService.refreshToken(mockUser);

      expect(result.user.role).toBe('USER');
      expect(result.token).toBe('mock-token');
    });
  });
});
