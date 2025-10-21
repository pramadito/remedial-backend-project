import { Request, Response } from "express";
import { CashierService } from "./cashier.service";

export class CashierController {
  private cashierService: CashierService;

  constructor() {
    this.cashierService = new CashierService();
  }

  createCashier = async (req: Request, res: Response) => {
    const result = await this.cashierService.createCashier(req.body);
    res.status(201).send(result);
  };

  getCashiers = async (_req: Request, res: Response) => {
    const result = await this.cashierService.getCashiers();
    res.status(200).send(result);
  };

  searchCashiers = async (req: Request, res: Response) => {
    const term = (req.query.search as string) || "";
    const result = await this.cashierService.searchCashiers(term);
    res.status(200).send(result);
  };

  getCashierById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.cashierService.getCashierById(id);
    res.status(200).send(result);
  };

  updateCashier = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.cashierService.updateCashier(id, req.body);
    res.status(200).send(result);
  };

  deleteCashier = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.cashierService.deleteCashier(id);
    res.status(200).send(result);
  };

  getCashierStats = async (_req: Request, res: Response) => {
    const result = await this.cashierService.getCashierStats();
    res.status(200).send(result);
  };
}
