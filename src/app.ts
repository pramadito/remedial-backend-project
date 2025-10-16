import cors from "cors";
import express, { Express } from "express";
import "reflect-metadata";
import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { AuthRouter } from "./modules/auth/auth.router";
import { BlogRouter } from "./modules/blog/blog.router";
import { SampleRouter } from "./modules/sample/sample.router";
import { TransactionRouter } from "./modules/transaction/transaction.router";
import { initializedWorkers } from "./workers";

export class App {
  app: Express;
  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
    //initializeScheduler();
    initializedWorkers();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    const authRouter = new AuthRouter();
    const blogRouter = new BlogRouter();
    const transactionRouter = new TransactionRouter();

    this.app.use("/samples", sampleRouter.getRoutes());
    this.app.use("/auth", authRouter.getRoutes());
    this.app.use("/blogs", blogRouter.getRoutes());
    this.app.use("/transactions", transactionRouter.getRoutes());
  }

  private handleError() {
    this.app.use(errorMiddleware);
  }

  public start() {
    this.app.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
    });
  }
}
