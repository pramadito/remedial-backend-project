import { Request, Response } from "express";
import { ReportService } from "./report.service";
import { ApiError } from "../../utils/api-error";

export class ReportController {
  private service: ReportService;
  constructor() {
    this.service = new ReportService();
  }

  getDaily = async (req: Request, res: Response) => {
    const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
    if (!/\d{4}-\d{2}-\d{2}/.test(date)) throw new ApiError("Invalid date format. Use YYYY-MM-DD", 400);
    const result = await this.service.getDailyReport(date);
    res.status(200).send(result);
  };

  getMismatches = async (req: Request, res: Response) => {
    const start = (req.query.start as string) || new Date().toISOString().slice(0, 10);
    const end = (req.query.end as string) || start;
    if (!/\d{4}-\d{2}-\d{2}/.test(start) || !/\d{4}-\d{2}-\d{2}/.test(end)) throw new ApiError("Invalid date format. Use YYYY-MM-DD", 400);
    const result = await this.service.getMismatchedShifts(start, end);
    res.status(200).send(result);
  };

  getSummary = async (req: Request, res: Response) => {
    const start = (req.query.start as string) || new Date().toISOString().slice(0, 10);
    const end = (req.query.end as string) || start;
    if (!/\d{4}-\d{2}-\d{2}/.test(start) || !/\d{4}-\d{2}-\d{2}/.test(end)) throw new ApiError("Invalid date format. Use YYYY-MM-DD", 400);
    const result = await this.service.getSummaryReport(start, end);
    res.status(200).send(result);
  };
}
