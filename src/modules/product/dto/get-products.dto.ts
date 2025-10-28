import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";

export class GetProductDTO extends PaginationQueryParams {
  @IsOptional()
  @IsString()
  search?: string;
}