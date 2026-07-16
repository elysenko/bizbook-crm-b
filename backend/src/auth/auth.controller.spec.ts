import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { SignupDto } from './dto/signup.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from 'src/user/entities/user.entity';
import { Role } from '../generated/prisma/client';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signup: jest.fn(),
            loginUser: jest.fn(),
            registerUser: jest.fn(),
            refreshToken: jest.fn(),
            me: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should initialize controller with authService', () => {
    expect(controller).toBeDefined();
    expect(authService).toBeDefined();
  });

  describe('signup', () => {
    it('delegates to authService.signup', async () => {
      const dto: SignupDto = { name: 'A', email: 'a@example.com', password: 'password123' };
      const expected = { user: { id: 'u1', role: 'ADMIN' }, token: 'tok' } as any;
      authService.signup.mockResolvedValue(expected);

      const result = await controller.signup(dto);

      expect(result).toEqual(expected);
      expect(authService.signup).toHaveBeenCalledWith(dto);
    });
  });

  describe('login', () => {
    it('delegates to authService.loginUser and returns the result', async () => {
      const loginDto: LoginUserDto = { email: 'test@example.com', password: 'password123' };
      const expected = { user: { id: 'u1' }, token: 'mock-token' } as any;
      authService.loginUser.mockResolvedValue(expected);

      const result = await controller.login(loginDto);

      expect(result).toEqual(expected);
      expect(authService.loginUser).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('propagates login errors', async () => {
      const loginDto: LoginUserDto = { email: 'test@example.com', password: 'wrong' };
      const error = new Error('Invalid credentials');
      authService.loginUser.mockRejectedValue(error);

      await expect(controller.login(loginDto)).rejects.toThrow(error);
    });
  });

  describe('me', () => {
    it('returns the current user', () => {
      const user = { id: 'u1', name: 'A', email: 'a@example.com', role: 'admin' } as any;
      const expected = { id: 'u1', name: 'A', email: 'a@example.com', role: 'ADMIN' } as any;
      authService.me.mockReturnValue(expected);

      const result = controller.me(user);

      expect(result).toEqual(expected);
      expect(authService.me).toHaveBeenCalledWith(user);
    });
  });

  describe('register', () => {
    it('registers a new user', async () => {
      const registerDto: RegisterUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        passwordconf: 'password123',
        image: null,
      };
      const expected = { user: { id: 'u1' }, token: 'mock-token' } as any;
      authService.registerUser.mockResolvedValue(expected);

      const result = await controller.register(registerDto);

      expect(result).toEqual(expected);
      expect(authService.registerUser).toHaveBeenCalledWith(registerDto);
    });
  });

  describe('refreshToken', () => {
    const userRole: Role = 'user';
    const mockUser = {
      id: '2313w49-0db7-4v79-aacc-52624343bf2t',
      name: 'Test User',
      email: 'test@example.com',
      role: userRole,
    };

    it('refreshes the token', async () => {
      const expected = { user: mockUser as unknown as User, token: 'new-mock-token' };
      authService.refreshToken.mockResolvedValue(expected);

      const result = await controller.refreshToken(mockUser as any);

      expect(result).toEqual(expected);
      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
    });
  });
});
