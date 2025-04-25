// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // Base path for all routes in this controller
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/register
  @Post('register')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })) // Validate incoming body against DTO
  async register(@Body() createUserDto: CreateUserDto) {
    // We don't want to return the full user object (esp. password hash)
    // Let's return a simple success message or selectively return non-sensitive fields
    const user = await this.authService.register(createUserDto);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user.toObject(); // Exclude password
    return result; // Or return { message: 'Registration successful' };
  }

  // POST /auth/login
  @Post('login')
  @HttpCode(HttpStatus.OK) // Set response code to 200 OK on success
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto); // Returns { access_token: '...' }
  }
}