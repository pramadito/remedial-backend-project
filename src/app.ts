import cors from "cors";
import express, { Express } from "express";
import "reflect-metadata";
import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { AuthRouter } from "./modules/auth/auth.router";

import { SampleRouter } from "./modules/sample/sample.router";
import { ProductRouter } from "./modules/product/product.router";


export class App {
  app: Express;
  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
    //initializeScheduler();

  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    const authRouter = new AuthRouter();
    // const userRouter= new UserRouter();
     const productRouter = new ProductRouter();
    // const transactionRouter = new TransactionRouter();
    // const shiftRouter = new ShiftRouter();

 

    this.app.use("/samples", sampleRouter.getRoutes());
    this.app.use("/auth", authRouter.getRoutes());
    // this.app.use('/users', userRouter.getRouter());
     this.app.use('/products', productRouter.getRouter());
    // this.app.use('/transactions', transactionRouter.getRouter());
    // this.app.use('/shifts', shiftRouter.getRouter());

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
