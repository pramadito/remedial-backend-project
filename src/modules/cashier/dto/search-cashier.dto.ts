// src/features/cashier/dto/search-cashier.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class SearchCashierDTO {
  @IsString()
  @IsOptional()
  search?: string;
}