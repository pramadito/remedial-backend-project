import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";
import { TransactionQueue } from "./transaction.queue";
import { CreatePosTransactionDTO } from "./dto/create-pos-transaction.dto";

export class TransactionService {
  private prisma: PrismaService;
  private transactionQueue: TransactionQueue;
  private mailService: MailService;
  private cloudinaryService: CloudinaryService;

  constructor() {
    this.prisma = new PrismaService();
    this.transactionQueue = new TransactionQueue();
    this.mailService = new MailService();
    this.cloudinaryService = new CloudinaryService();
  }

  createPosTransaction = async (body: CreatePosTransactionDTO, user?: { id: string; role: string }) => {
    // If the caller is a CASHIER, ensure they have an active shift and the provided shiftId matches it
    if (user?.role === "CASHIER") {
      if (!body.shiftId) throw new ApiError("Shift aktif tidak ditemukan", 400);
      const active = await this.prisma.shift.findFirst({
        where: { id: body.shiftId, cashierId: user.id, endTime: null },
      });
      if (!active) throw new ApiError("Shift tidak aktif atau tidak sesuai dengan kasir", 400);
    }
    if (body.items.length === 0) {
      throw new ApiError("Items cannot be empty", 400);
    }

    // Fetch products in one query
    const productIds = body.items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({ where: { id: { in: productIds } } });

    // Validate stock
    for (const item of body.items) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) throw new ApiError(`Product ${item.productId} not found`, 400);
      if (p.deletedAt) throw new ApiError(`Product ${p.name} is deleted`, 400);
      if (p.stock < item.quantity) throw new ApiError(`Insufficient stock for ${p.name}`, 400);
    }

    // Calculate totals
    const totalAmount = body.items.reduce((acc, item) => {
      const p = products.find((x) => x.id === item.productId)!;
      return acc + p.price * item.quantity;
    }, 0);

    const { paymentMethod } = body;
    let cashAmount: number | null = null;
    let changeAmount: number | null = null;
    let debitCardNumber: string | null = null;

    if (paymentMethod === "CASH") {
      cashAmount = body.cashAmount ?? 0;
      if (cashAmount < totalAmount) throw new ApiError("Cash amount is less than total", 400);
      changeAmount = cashAmount - totalAmount;
    } else {
      debitCardNumber = body.debitCardNumber ?? null;
      if (!debitCardNumber) throw new ApiError("debitCardNumber is required for DEBIT", 400);
    }

    // Persist in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.create({
        data: {
          shiftId: body.shiftId,
          paymentMethod,
          debitCardNumber: debitCardNumber ?? undefined,
          cashAmount: cashAmount ?? undefined,
          changeAmount: changeAmount ?? undefined,
          totalAmount,
        },
      });

      await tx.transactionItem.createMany({
        data: body.items.map((it) => {
          const p = products.find((x) => x.id === it.productId)!;
          return {
            transactionId: trx.id,
            productId: p.id,
            quantity: it.quantity,
            price: p.price,
          };
        }),
      });

      for (const it of body.items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: it.quantity } },
        });
      }

      return trx;
    });

    return { message: "POS transaction created", transaction: result };
  };

  createTransaction = async (
    _body: CreateTransactionDTO,
    _authUserId: number
  ) => {
    throw new ApiError("Deprecated endpoint. Use POST /transactions/pos", 400);
  };

  uploadPaymentProof = async (
    _uuid: string,
    _paymentProof: Express.Multer.File,
    _authUserId: number
  ) => {
    throw new ApiError("Not supported in POS flow", 400);
  };

  updateTransaction = async (_body: UpdateTransactionDTO) => {
    throw new ApiError("Not supported in POS flow", 400);
  };

  getTransactions = async (
    query?: { shiftId?: string; from?: string; to?: string },
    user?: { id: string; role: string }
  ) => {
    const where: any = {};
    if (query?.shiftId) where.shiftId = query.shiftId;
    if (query?.from || query?.to) {
      const fromStr = query?.from || query?.to!;
      const toStr = query?.to || query?.from!;
      const start = new Date(fromStr); start.setHours(0,0,0,0);
      const end = new Date(toStr); end.setHours(23,59,59,999);
      where.createdAt = { gte: start, lte: end };
    }
    // If caller is CASHIER, restrict to their own transactions via relation to shift.cashierId
    if (user?.role === "CASHIER") {
      where.shift = { cashierId: user.id };
    }
    const transactions = await this.prisma.transaction.findMany({
      where,
      include: { 
        transactionItems: { include: { product: true } },
        shift: { include: { cashier: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return { transactions };
  };
    
}
