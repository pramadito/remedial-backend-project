import { ApiError } from "../../utils/api-error";
import { PrismaService } from "../prisma/prisma.service";

export class ShiftService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  getActiveShift = async (cashierId: string) => {
    const shift = await this.prisma.shift.findFirst({
      where: { cashierId, endTime: null },
    });
    return { shift };
  };

  startShift = async (cashierId: string, startMoney: number) => {
    // end any previous dangling shift (should not happen normally)
    const active = await this.prisma.shift.findFirst({ where: { cashierId, endTime: null } });
    if (active) {
      throw new ApiError("Shift is already active", 400);
    }

    const shift = await this.prisma.shift.create({
      data: {
        cashierId,
        startMoney,
        startTime: new Date(),
      },
    });
    return { message: "Shift started", shift };
  };

  endShift = async (cashierId: string, endMoney: number) => {
    // Find the active shift
    const active = await this.prisma.shift.findFirst({ 
      where: { cashierId, endTime: null },
      include: {
        transactions: {
          where: { paymentMethod: 'CASH' },
          select: { cashAmount: true, changeAmount: true }
        }
      }
    });
    
    if (!active) {
      throw new ApiError("Tidak ada shift aktif yang ditemukan", 400);
    }

    // Update the shift with end money and end time
    const shift = await this.prisma.shift.update({
      where: { id: active.id },
      data: { 
        endMoney: endMoney,
        endTime: new Date() 
      },
    });
    
    return { message: "Shift berhasil diakhiri", shift };
  };
}
