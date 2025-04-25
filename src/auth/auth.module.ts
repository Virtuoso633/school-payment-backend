// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Import UsersModule
import { PassportModule } from '@nestjs/passport'; // Import PassportModule
import { JwtModule } from '@nestjs/jwt'; // Import JwtModule
import { JwtStrategy } from './strategies/jwt.strategy'; 
import { ConfigModule, ConfigService } from '@nestjs/config'; // Import ConfigModule/Service

@Module({
  imports: [
    UsersModule, // Make UsersService available
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register Passport with default JWT strategy
    JwtModule.registerAsync({ // Configure JWT module asynchronously
      imports: [ConfigModule], // Import ConfigModule for ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Get secret from .env
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION_TIME'), // Get expiration from .env
        },
      }),
      inject: [ConfigService], // Inject ConfigService into the factory
    }),
    ConfigModule, // Ensure ConfigModule is imported if not global in AppModule (it is global, but explicit doesn't hurt)
  ],
  providers: [AuthService,JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService, PassportModule, JwtModule] // Export for use elsewhere if needed
})
export class AuthModule {}