// src/features/product/routes/product.router.ts
import { Router } from "express";
import { JwtMiddleware } from "../../middlewares/jwt.middleware";
import { validateBody } from "../../middlewares/validation.middleware";
import { ProductController } from "./product.controller";
import { CreateProductDTO } from "./dto/create-product.dto";
import { UpdateProductDTO } from "./dto/update-product.dto";
import { AdjustStockDTO } from "./dto/adjust-product.dto";

export class ProductRouter {
  private router: Router;
  private productController: ProductController;
  private jwtMiddleware: JwtMiddleware;

  constructor() {
    this.router = Router();
    this.productController = new ProductController();
    this.jwtMiddleware = new JwtMiddleware();

    this.initializeRoutes();
  }

  private initializeRoutes = () => {
    // Public routes
    this.router.get("/", this.productController.getProducts);
    this.router.get("/:id", this.productController.getProductById);

    // Admin routes
    this.router.post(
      "/",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ADMIN"]),
      validateBody(CreateProductDTO),
      this.productController.createProduct
    );

    this.router.put(
      "/:id",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ADMIN"]),
      validateBody(UpdateProductDTO),
      this.productController.updateProduct
    );

    this.router.delete(
      "/:id",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ADMIN"]),
      this.productController.deleteProduct
    );

    this.router.patch(
      "/:id/stock",
      this.jwtMiddleware.verifyToken(process.env.JWT_SECRET!),
      this.jwtMiddleware.verifyRole(["ADMIN"]),
      validateBody(AdjustStockDTO),
      this.productController.adjustStock
    );
  };

  getRouter = () => {
    return this.router;
  };
}
