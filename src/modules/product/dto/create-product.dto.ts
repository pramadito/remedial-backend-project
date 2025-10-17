// src/modules/product/dto/create-product.dtots
import { IsString, IsNumber, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateProductDTO {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @IsNumber()
  @IsNotEmpty()
  stock!: number;

  @IsString()
  @IsOptional()
  description?: string;


}

