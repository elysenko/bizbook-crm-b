import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcryptjs';

import { RegisterUserDto } from './dto/register-user.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

import { PrismaService } from 'src/prisma/prisma.service';
import { User } from 'src/user/entities/user.entity';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client';
import { toApiRole, toUserResponse } from 'src/common/role.util';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    private prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  /**
   * Public signup. The very first account created (empty user table) becomes
   * ADMIN; every subsequent account is a USER. Returns the new user + JWT.
   */
  async signup(dto: SignupDto) {
    const email = dto.email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // First user in the system is the owner/admin.
    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? 'admin' : 'user';

    try {
      const newUser = await this.prisma.user.create({
        data: { name: dto.name, email, password: hashedPassword, role },
        select: USER_SELECT,
      });

      return {
        user: toUserResponse(newUser),
        token: this.buildToken(newUser),
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.warn(`signup: email already exists: ${email}`);
        throw new ConflictException('Email already registered');
      }
      this.logger.error(`signup: error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  /** Legacy register endpoint (kept for the bundled template). */
  async registerUser(dto: RegisterUserDto): Promise<any> {
    if (dto.password !== dto.passwordconf) throw new BadRequestException('Passwords do not match');

    dto.email = dto.email.toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    try {
      const { passwordconf: _pwc, ...rest } = dto;
      const newUser = await this.prisma.user.create({
        data: { ...rest, password: hashedPassword },
        select: USER_SELECT,
      });

      return {
        user: toUserResponse(newUser),
        token: this.buildToken(newUser),
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      this.logger.error(`register: error: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Server error');
    }
  }

  async loginUser(email: string, password: string): Promise<any> {
    const normalizedEmail = email.toLowerCase().trim();
    let user;
    try {
      user = await this.prisma.user.findUniqueOrThrow({
        where: { email: normalizedEmail },
        select: { ...USER_SELECT, password: true },
      });
    } catch {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    delete user.password;

    return {
      user: toUserResponse(user),
      token: this.buildToken(user),
    };
  }

  /** Returns the currently authenticated user in API shape. */
  me(user: User) {
    return toUserResponse(user);
  }

  async refreshToken(user: User) {
    return {
      user: toUserResponse(user),
      token: this.buildToken(user),
    };
  }

  private buildToken(user: { id: string; role: string | any; name: string }) {
    const payload: JwtPayload = {
      sub: user.id,
      role: toApiRole(user.role),
      name: user.name,
    };
    return this.jwtService.sign(payload);
  }
}
