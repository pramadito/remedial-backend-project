import { IsOptional, IsString } from "class-validator";
import { PaginationQueryParams } from "../../pagination/pagination.dto";


export class GetBlogsDTO extends PaginationQueryParams{
    @IsOptional()
    @IsString()
    search?:string;
}