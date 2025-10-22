import { IsNumber, Min } from "class-validator";

export class StartShiftDTO {
  @IsNumber()
  @Min(0)
  startMoney!: number;
}
