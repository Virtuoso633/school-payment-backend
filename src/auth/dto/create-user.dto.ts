// src/auth/dto/create-user.dto.ts
import { IsString, MinLength, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsString()
  @MinLength(6) // Enforce minimum password length
  password: string;

  @IsOptional() // Make email optional during registration
  @IsEmail()
  email?: string;
}