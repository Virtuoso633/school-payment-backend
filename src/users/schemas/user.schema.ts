// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as bcrypt from 'bcrypt';

export type UserDocument = User & Document;

@Schema({ timestamps: true }) // Enable timestamps (createdAt, updatedAt)
export class User {
  @Prop({ required: true, unique: true, index: true }) // Add index for faster lookup
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ unique: true, sparse: true }) // Optional, unique if provided
  email?: string; // Marked as optional as per spec (login credentials)
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook to hash password before saving
UserSchema.pre<UserDocument>('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  // Hash the password with a salt round of 10
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Optional: Method to compare passwords (useful for login)
UserSchema.methods.comparePassword = function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};