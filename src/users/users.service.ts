// src/users/users.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
// We will Import CreateUserDto later when setting up validation/auth

@Injectable()
export class UsersService {
  // Inject the User model
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Method to find a user by their username
  async findOneByUsername(username: string): Promise<UserDocument | undefined> {
    // Uses the injected Mongoose model to query the database
    const user = await this.userModel.findOne({ username }).exec();
    return user || undefined;
  }

  // We will add a 'create' method here later during Auth setup
  // async create(createUserDto: /* CreateUserDto */ any): Promise<UserDocument> {
  //   const newUser = new this.userModel(createUserDto);
  //   return newUser.save(); // Password hashing happens via the pre-save hook in schema
  // }
}