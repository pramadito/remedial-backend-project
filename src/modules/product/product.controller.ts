// src/features/product/controllers/product.controller.ts
import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { ApiError } from "../../utils/api-error";

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  createProduct = async (req: Request, res: Response) => {
    const result = await this.productService.createProduct(req.body);
    res.status(201).send(result);
  };

  getProducts = async (req: Request, res: Response) => {
    const result = await this.productService.getProducts();
    res.status(200).send(result);
  };

  getProductById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.productService.getProductById(id);
    res.status(200).send(result);
  };

  updateProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.productService.updateProduct(id, req.body);
    res.status(200).send(result);
  };

  deleteProduct = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.productService.deleteProduct(id);
    res.status(200).send(result);
  };

  adjustStock = async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await this.productService.adjustStock(id, req.body);
    res.status(200).send(result);
  };


}