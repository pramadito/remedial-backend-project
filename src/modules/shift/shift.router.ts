import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { ShiftController } from "./shift.controller";
import { StartShiftDTO } from "./dto/start-shift.dto";
import { EndShiftDTO } from "./dto/end-shift.dto";

export class ShiftRouter {
  private router: Router;
  private controller: ShiftController;
  private jwt: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new ShiftController();
    this.jwt = new JwtMiddleware();
    this.init();
  }

  private init() {
    this.router.get(
      "/active",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["CASHIER", "ADMIN"] as any),
      this.controller.getActive
    );

    this.router.post(
      "/",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["CASHIER", "ADMIN"] as any),
      validateBody(StartShiftDTO),
      this.controller.start
    );

    this.router.patch(
      "/end",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["CASHIER", "ADMIN"] as any),
      validateBody(EndShiftDTO),
      this.controller.end
    );
  }

  getRouter = () => this.router;
}
