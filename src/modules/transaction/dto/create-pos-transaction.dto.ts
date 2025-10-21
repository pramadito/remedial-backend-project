import { Type } from "class-transformer";
import { IsArray, IsIn, IsNotEmpty, IsOptional, IsString, ValidateNested, IsNumber, Min } from "class-validator";

class PosItemDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreatePosTransactionDTO {
  @IsString()
  @IsNotEmpty()
  shiftId!: string;

  @IsIn(["CASH", "DEBIT"])
  paymentMethod!: "CASH" | "DEBIT";

  @IsOptional()
  @IsNumber()
  @Min(0)
  cashAmount?: number;

  @IsOptional()
  @IsString()
  debitCardNumber?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PosItemDto)
  items!: PosItemDto[];
}
