import { IsNumber, Min } from "class-validator";

export class EndShiftDTO {
  @IsNumber()
  @Min(0)
  endMoney!: number;
}
