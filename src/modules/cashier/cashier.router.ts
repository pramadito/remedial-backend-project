import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CashierController } from "./cashier.controller";
import { CreateCashierDTO } from "./dto/create-cashier.dto";
import { UpdateCashierDTO } from "./dto/update-cashier.dto";

export class CashierRouter {
  private router: Router;
  private controller: CashierController;
  private jwt: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.controller = new CashierController();
    this.jwt = new JwtMiddleware();
    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    // Admin protected routes
    this.router.post(
      "/",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"] as any),
      validateBody(CreateCashierDTO),
      this.controller.createCashier
    );

    this.router.put(
      "/:id",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"] as any),
      validateBody(UpdateCashierDTO),
      this.controller.updateCashier
    );

    this.router.delete(
      "/:id",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"] as any),
      this.controller.deleteCashier
    );

    this.router.get(
      "/stats",
      this.jwt.verifyToken(process.env.JWT_SECRET!),
      this.jwt.verifyRole(["ADMIN"] as any),
      this.controller.getCashierStats
    );

    // Public read routes (admin UI still uses token; but keeping parity with product read)
    this.router.get("/", (req, res) => {
      if (typeof req.query.search === "string" && req.query.search.length > 0) {
        return this.controller.searchCashiers(req, res);
      }
      return this.controller.getCashiers(req, res);
    });

    this.router.get("/:id", this.controller.getCashierById);
  };

  getRouter = () => this.router;
}
