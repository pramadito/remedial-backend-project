import express, { Express } from "express";
import cors from "cors";
import { PORT } from "./config/env";
import { SampleRouter } from "./modules/sample/sample.router";
import { error } from "console";
import { errorMiddleware } from "./middlewares/error.middleware";

export class App {
  app: Express;
  constructor() {
    this.app = express();
    this.configure();
    this.routes();
    this.handleError();
  }

  private configure() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private routes() {
    const sampleRouter = new SampleRouter();
    this.app.use("/sample", sampleRouter.getRoutes());
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
