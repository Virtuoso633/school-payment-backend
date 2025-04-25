// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt'; // Re-import bcrypt if needed, or use method from User model
import { CreateUserDto } from './dto/create-user.dto'; // We'll create this DTO next
import { LoginDto } from './dto/login.dto'; // We'll create this DTO next
import { UserDocument } from 'src/users/schemas/user.schema'; // Import UserDocument if needed

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // 1. Validate User Credentials (for login)
  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByUsername(username);

    // Check if user exists and password is correct (using the method from User schema)
    // Note: Assumes UserSchema.methods.comparePassword was defined correctly
    if (user && await user.comparePassword(pass)) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user.toObject(); // Return user object without password
      return result;
    }
    return null; // Return null if validation fails
  }

  // 2. Login User (after validation)
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // User is validated, create JWT payload
    const payload = { username: user.username, sub: user._id }; // 'sub' is standard for user ID

    // Sign the payload to create the JWT
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // 3. Register New User
  async register(createUserDto: CreateUserDto): Promise<UserDocument> {
     // Check if username already exists
     const existingUser = await this.usersService.findOneByUsername(createUserDto.username);
     if (existingUser) {
         throw new ConflictException('Username already exists');
     }

     // Note: We need to add the 'create' method to UsersService
     try {
        // Password hashing is handled by the pre-save hook in user.schema.ts
        const newUser = await this.usersService.create(createUserDto);
        return newUser;
     } catch (error) {
         // Handle potential DB errors, e.g., unique constraint on email if added
         if (error.code === 11000) { // MongoDB duplicate key error
             throw new ConflictException('Username or Email already exists');
         }
         throw error; // Re-throw other errors
     }
  }
}