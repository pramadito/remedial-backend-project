import cors from "cors";
import express, { Express } from "express";
import "reflect-metadata";
import { PORT } from "./config/env";
import { errorMiddleware } from "./middlewares/error.middleware";
import { AuthRouter } from "./modules/auth/auth.router";

import { SampleRouter } from "./modules/sample/sample.router";
import { ProductRouter } from "./modules/product/product.router";
import { CashierRouter } from "./modules/cashier/cashier.router";
//import { ShiftRouter } from "./modules/shift/shift.router";
import { TransactionRouter } from "./modules/transaction/transaction.router";
//import { ReportRouter } from "./modules/report/report.router";


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
     const cashierRouter = new CashierRouter();
     //const shiftRouter = new ShiftRouter();
     const transactionRouter = new TransactionRouter();
     //const reportRouter = new ReportRouter();

 

    this.app.use("/samples", sampleRouter.getRoutes());
    this.app.use("/auth", authRouter.getRoutes());
    // this.app.use('/users', userRouter.getRouter());
     this.app.use('/products', productRouter.getRouter());
     this.app.use('/cashiers', cashierRouter.getRouter());
     //this.app.use('/shifts', shiftRouter.getRouter());
     this.app.use('/transactions', transactionRouter.getRoutes());
     //this.app.use('/reports', reportRouter.getRoutes());

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
