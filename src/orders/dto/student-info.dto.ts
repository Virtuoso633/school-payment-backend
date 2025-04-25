// src/orders/dto/student-info.dto.ts
// Basic structure for now, validation decorators will be added later

import { IsString, IsEmail, IsNotEmpty } from 'class-validator';

export class StudentInfoDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  id: string; // Student ID

  @IsNotEmpty()
  @IsEmail()
  email: string;
}