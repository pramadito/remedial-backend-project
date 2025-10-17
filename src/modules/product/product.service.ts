// src/features/product/services/product.service.ts
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { CreateProductDTO } from "./dto/create-product.dto";
import { UpdateProductDTO } from "./dto/update-product.dto";
import { AdjustStockDTO } from "./dto/adjust-product.dto";




export class ProductService {
  private prisma: PrismaService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.cloudinaryService = new CloudinaryService();
  }

  createProduct = async (body: CreateProductDTO) => {
    const product = await this.prisma.product.create({
      data: body,
    });
    return { message: "Product created successfully", product };
  };

  getProducts = async () => {
    const products = await this.prisma.product.findMany({
      where: { deletedAt: null },
    });
    return { products };
  };

  getProductById = async (id: string) => {
    const product = await this.prisma.product.findFirst({
      where: { id, deletedAt: null },
    });
    if (!product) {
      throw new ApiError("Product not found", 404);
    }
    return { product };
  };

  updateProduct = async (id: string, body: UpdateProductDTO) => {
    const product = await this.prisma.product.update({
      where: { id },
      data: body,
    });
    return { message: "Product updated successfully", product };
  };

  deleteProduct = async (id: string) => {
    // Soft delete
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: "Product deleted successfully" };
  };

   adjustStock = async (id: string, body: AdjustStockDTO) => {
    // First, check if product exists
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      throw new ApiError("Product not found", 404);
    }

    // Calculate new stock value
    const newStock = product.stock + body.quantity;
    
    // Ensure stock doesn't go negative
    if (newStock < 0) {
      throw new ApiError("Insufficient stock for this adjustment", 400);
    }

    // Update the product with new stock value
    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: { stock: newStock },
    });
    
    return { 
      message: "Product stock adjusted successfully", 
      product: updatedProduct,
      previousStock: product.stock,
      adjustedBy: body.quantity,
      newStock: updatedProduct.stock
    };
  };


}