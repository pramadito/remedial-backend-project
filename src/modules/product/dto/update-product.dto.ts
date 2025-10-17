// src/modules/product/dto/update-product.dto.ts
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateProductDTO {
  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  image?: string;
}