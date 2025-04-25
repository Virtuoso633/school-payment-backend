// src/orders/dto/create-payment.dto.ts
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, IsNumber, Min, ValidateNested, IsMongoId, IsOptional } from 'class-validator';
import { StudentInfoDto } from './student-info.dto'; // Reuse the student info DTO

export class CreatePaymentDto {
  // School ID might come from user context or request body
  @IsNotEmpty()
  @IsString()
  // Consider IsMongoId() if school_id is an ObjectId in another collection
  school_id: string;

  // Trustee ID might be optional if inferred from logged-in user
  @IsOptional()
  @IsString()
  // Consider IsMongoId() if trustee_id is an ObjectId
  trustee_id?: string; // Let's make it optional for now

  @IsNotEmpty()
  @ValidateNested() // Validate the nested object
  @Type(() => StudentInfoDto) // Tell class-validator how to handle the nested type
  student_info: StudentInfoDto;

  @IsNotEmpty()
  @IsNumber()
  @Min(1) // Assuming amount must be at least 1 (e.g., 1 INR)
  amount: number; // Amount in INR (as per payment API docs)

  // Callback URL could be sent from frontend, or configured globally
  @IsNotEmpty()
  @IsString() // Could add @IsUrl() for stricter validation
  callback_url: string; // The URL the payment gateway redirects to *after* payment
}

