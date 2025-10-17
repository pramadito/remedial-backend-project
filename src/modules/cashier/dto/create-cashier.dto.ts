// src/features/cashier/dto/create-cashier.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCashierDTO {
  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}