import { Controller, Get, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';

import { RegisterUserDto } from './dto/register-user.dto';
import { SignupDto } from './dto/signup.dto';
import { AuthService } from './auth.service';
import { LoginResponse } from './interfaces';
import { Auth, GetUser } from './decorators';

import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LoginUserDto } from './dto/login-user.dto';
import { User } from 'src/user/entities/user.entity';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @ApiOperation({
    summary: 'SIGNUP',
    description:
      'Public endpoint. First account created becomes ADMIN; subsequent accounts become USER.',
  })
  @ApiResponse({ status: 201, description: 'Created', type: LoginResponse })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'LOGIN',
    description: 'Public endpoint to login and get the Access Token',
  })
  @ApiResponse({ status: 200, description: 'Ok', type: LoginResponse })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto.email, loginUserDto.password);
  }

  @Get('me')
  @ApiOperation({
    summary: 'ME',
    description: 'Returns the currently authenticated user.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Ok', type: User })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth()
  me(@GetUser() user: User) {
    return this.authService.me(user);
  }

  @Post('register')
  @ApiOperation({
    summary: 'REGISTER (legacy)',
    description: 'Public endpoint to register a new user with "user" Role.',
  })
  @ApiResponse({ status: 201, description: 'Ok', type: LoginResponse })
  register(@Body() createUserDto: RegisterUserDto) {
    return this.authService.registerUser(createUserDto);
  }

  @Get('refresh-token')
  @ApiOperation({
    summary: 'REFRESH TOKEN',
    description: 'Private endpoint for logged-in users to refresh the Access Token.',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Ok', type: LoginResponse })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Auth()
  refreshToken(@GetUser() user: User) {
    return this.authService.refreshToken(user);
  }
}
