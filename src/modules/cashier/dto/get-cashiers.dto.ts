import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";

export class GetCashiersDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string;
}