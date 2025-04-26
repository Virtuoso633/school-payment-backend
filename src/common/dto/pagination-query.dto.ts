// src/common/dto/pagination-query.dto.ts
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number) // Transform query param string to number
  @IsInt()
  @Min(1)
  @Max(100) // Set a reasonable max limit
  limit?: number = 10; // Default limit

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1; // Default page

  @IsOptional()
  @IsString()
  // Add valid sortable fields here if you want strict validation
  // @IsIn(['createdAt', 'payment_time', 'status', 'order_amount', 'transaction_amount', 'school_id'])
  sort?: string = 'createdAt'; // Default sort field

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc'; // Default sort order
}