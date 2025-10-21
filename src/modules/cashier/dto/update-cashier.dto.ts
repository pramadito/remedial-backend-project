// src/features/cashier/dto/update-cashier.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class UpdateCashierDTO {
  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  name?: string;
}