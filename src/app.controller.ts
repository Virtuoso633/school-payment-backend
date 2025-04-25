// src/app.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common'; // Import UseGuards, Request
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard'; // Import the guard

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // Protect this route using the JwtAuthGuard
  @UseGuards(JwtAuthGuard)
  @Get()
  getHello(@Request() req): string {
    // Access user info attached by JwtStrategy's validate method
    console.log('User making request:', req.user); // { userId: '...', username: '...' }
    return `Hello authenticated user ${req.user.username}!`;
    // return this.appService.getHello(); // Original return
  }

  // Example of a public route
  @Get('public')
  getPublicData(): string {
    return "This data is public.";
  }
}