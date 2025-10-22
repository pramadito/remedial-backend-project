import { Request, Response } from "express";
import { ShiftService } from "./shift.service";

export class ShiftController {
  private service: ShiftService;
  constructor() {
    this.service = new ShiftService();
  }

  getActive = async (_req: Request, res: Response) => {
    const cashierId = res.locals.user.id as string;
    const result = await this.service.getActiveShift(cashierId);
    res.status(200).send(result);
  };

  start = async (req: Request, res: Response) => {
    const cashierId = res.locals.user.id as string;
    const { startMoney } = req.body as { startMoney: number };
    const result = await this.service.startShift(cashierId, startMoney);
    res.status(201).send(result);
  };

  end = async (req: Request, res: Response) => {
    const cashierId = res.locals.user.id as string;
    const { endMoney } = req.body as { endMoney: number };
    const result = await this.service.endShift(cashierId, endMoney);
    res.status(200).send(result);
  };
}
