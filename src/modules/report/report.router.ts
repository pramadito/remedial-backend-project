import { Router } from "express";
import { ReportController } from "./report.controller";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";

export class ReportRouter {
  private router: Router;
  private controller: ReportController;
  private jwt: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new ReportController();
    this.jwt = new JwtMiddleware();
    this.init();
  }

  private init() {
    // Admin-only endpoints
    this.router.get(
      "/daily",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"]),
      this.controller.getDaily
    );
    this.router.get(
      "/mismatches",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"]),
      this.controller.getMismatches
    );
    this.router.get(
      "/summary",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"]),
      this.controller.getSummary
    );
  }

  getRoutes() {
    return this.router;
  }
}
