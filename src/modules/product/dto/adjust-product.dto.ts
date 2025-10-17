// src/features/product/dto/adjust-stock.dto.ts
import { IsNumber, IsNotEmpty } from 'class-validator';

export class AdjustStockDTO {
  @IsNumber()
  @IsNotEmpty()
  quantity!: number;
}