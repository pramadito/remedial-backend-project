import { Router } from "express";

import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { TransactionController } from "./transaction.controller";
import { UploadPaymentProofDTO } from "./dto/upload-payment-proof.dto";
import { UploaderMiddleware } from "../../middlewares/uploader.middleware";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";
import { CreatePosTransactionDTO } from "./dto/create-pos-transaction.dto";

export class TransactionRouter {
  private router: Router;
  private transactionController: TransactionController;
  private jwtMiddleware: JwtMiddleware;
  private uploaderMiddleware: UploaderMiddleware;

  constructor() {
    this.router = Router();
    this.transactionController = new TransactionController();
    this.jwtMiddleware = new JwtMiddleware();
    this.uploaderMiddleware = new UploaderMiddleware();
    this.initializedRoutes();
  }
  private initializedRoutes = () => {
    this.router.get(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CASHIER", "ADMIN"] as any),
      this.transactionController.getTransactions
    );

    // POS checkout by cashier/admin
    this.router.post(
      "/pos",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CASHIER", "ADMIN"] as any),
      validateBody(CreatePosTransactionDTO),
      this.transactionController.posCheckout
    );
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ADMIN"]),
      validateBody(CreateTransactionDTO),
      this.transactionController.createTransaction
    );
    this.router.patch(
      "/payment-proof",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["CASHIER"] as any),
      this.uploaderMiddleware
        .upload()
        .fields([{ name: "paymentProof", maxCount: 1 }]),
      this.uploaderMiddleware.fileFilter([
        "image/jpeg",
        "image/png",
        "image/avif",
        "image/webp",
        "image/heic"  
      ]),
      validateBody(UploadPaymentProofDTO),
      this.transactionController.UploadPaymentProof
    );
    this.router.patch(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ADMIN"]),
      validateBody(UpdateTransactionDTO),
      this.transactionController.updateTransaction
    );
  };

  getRoutes = () => {
    return this.router;
  };
}
