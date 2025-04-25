// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // Adjust path if needed

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) { // Use 'jwt' which is the default name
  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // Inject UsersService to potentially fetch user details
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extracts token from "Bearer <token>" header
      ignoreExpiration: false, // Ensure expired tokens are rejected
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret', // Use the same secret as in JwtModule
    });
  }

  // This method runs after the token is verified (signature, expiration)
  async validate(payload: any) {
    // 'payload' is the decoded JWT content (e.g., { username: 'test', sub: 'userId', iat: ..., exp: ... })
    // You can optionally fetch the full user object from DB here if needed for authorization roles etc.
    // const user = await this.usersService.findOneById(payload.sub); // Example if findOneById exists
    // if (!user) {
    //   throw new UnauthorizedException();
    // }
    // Return the payload (or parts of it, or the full user object)
    // This return value will be attached to the Request object as `request.user`
    return { userId: payload.sub, username: payload.username };
  }
}