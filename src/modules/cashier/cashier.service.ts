// src/features/cashier/services/cashier.service.ts

import * as bcrypt from 'bcrypt';
import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCashierDTO } from './dto/create-cashier.dto';
import { UpdateCashierDTO } from './dto/update-cashier.dto';
import { GetCashiersDTO } from './dto/get-cashiers.dto';


export class CashierService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService();
  }

  createCashier = async (body: CreateCashierDTO) => {
    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { 
        email: body.email,
        deletedAt: null
      },
    });

    if (existingUser) {
      throw new ApiError("Email already exists", 400);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create cashier (user with CASHIER role)
    const cashier = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        name: body.name,
        role: "CASHIER",
      },
    });

    // Remove password from response
    const { password, ...cashierWithoutPassword } = cashier;

    return { message: "Cashier created successfully", cashier: cashierWithoutPassword };
  };

  getCashiers = async (query: GetCashiersDTO) => {
    const cashiers = await this.prisma.user.findMany({
      where: { 
        role: "CASHIER",
        deletedAt: null 
      },
      include: {
        shifts: {
          where: {
            endTime: null // Only include active shifts
          }
        }
      }
    });

    // Remove passwords from response
    const cashiersWithoutPasswords = cashiers.map((cashier: any) => {
      const { password, ...cashierWithoutPassword } = cashier;
      return cashierWithoutPassword;
    });

    return { cashiers: cashiersWithoutPasswords };
  };

  searchCashiers = async (searchTerm: string) => {
    const cashiers = await this.prisma.user.findMany({
      where: {
        AND: [
          { role: "CASHIER" },
          { deletedAt: null },
          {
            OR: [
              {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              },
              {
                name: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            ]
          }
        ]
      },
      include: {
        shifts: {
          where: {
            endTime: null // Only include active shifts
          }
        }
      }
    });

    // Remove passwords from response
    const cashiersWithoutPasswords = cashiers.map((cashier: any) => {
      const { password, ...cashierWithoutPassword } = cashier;
      return cashierWithoutPassword;
    });

    return { cashiers: cashiersWithoutPasswords };
  };

  getCashierById = async (id: string) => {
    const cashier = await this.prisma.user.findFirst({
      where: { 
        id, 
        role: "CASHIER",
        deletedAt: null 
      },
      include: {
        shifts: true
      }
    });

    if (!cashier) {
      throw new ApiError("Cashier not found", 404);
    }

    // Remove password from response
    const { password, ...cashierWithoutPassword } = cashier;

    return { cashier: cashierWithoutPassword };
  };

  updateCashier = async (id: string, body: UpdateCashierDTO) => {
    // Check if cashier exists
    const cashier = await this.prisma.user.findFirst({
      where: { 
        id, 
        role: "CASHIER",
        deletedAt: null 
      },
    });

    if (!cashier) {
      throw new ApiError("Cashier not found", 404);
    }

    // If updating email, check if it's already taken
    if (body.email && body.email !== (cashier as any).email) {
      const existingUser = await this.prisma.user.findFirst({
        where: { 
          email: body.email,
          deletedAt: null,
          NOT: { id }
        },
      });

      if (existingUser) {
        throw new ApiError("Email already exists", 400);
      }
    }

    // If updating password, hash it
    let updateData: any = { ...body };
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    const updatedCashier = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    // Remove password from response
    const { password, ...cashierWithoutPassword } = updatedCashier;

    return { message: "Cashier updated successfully", cashier: cashierWithoutPassword };
  };

  deleteCashier = async (id: string) => {
    // Check if cashier has any active shifts
    const activeShift = await this.prisma.shift.findFirst({
      where: {
        cashierId: id,
        endTime: null
      }
    });

    if (activeShift) {
      throw new ApiError("Cannot delete cashier with active shift", 400);
    }

    // Soft delete cashier
    await this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: "Cashier deleted successfully" };
  };

  getCashierStats = async () => {
    // Get total number of cashiers
    const totalCashiers = await this.prisma.user.count({
      where: { 
        role: "CASHIER",
        deletedAt: null 
      },
    });

    // Get number of active cashiers (with active shifts)
    const activeCashiers = await this.prisma.user.count({
      where: { 
        role: "CASHIER",
        deletedAt: null,
        shifts: {
          some: {
            endTime: null
          }
        }
      },
    });

    // Get number of inactive cashiers (without active shifts)
    const inactiveCashiers = totalCashiers - activeCashiers;

    return {
      totalCashiers,
      activeCashiers,
      inactiveCashiers
    };
  };
}