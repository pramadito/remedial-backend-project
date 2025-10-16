import { ApiError } from "../../utils/api-error";
import { CloudinaryService } from "../cloudinary/cloudinary.service";
import { MailService } from "../mail/mail.service";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTransactionDTO } from "./dto/create-transaction.dto";
import { UpdateTransactionDTO } from "./dto/update-transaction.dto";
import { TransactionQueue } from "./transaction.queue";

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

  createTransaction = async (
    body: CreateTransactionDTO,
    authUserId: number
  ) => {
    //
    // validate product stocks
    // if stock less than qty throw ApiError
    // create data on model transaction & model TransactionDetail

    const payload = body.payload; // [{ productId: 1, qty: 2 }, { productId: 2, qty: 3 }]

    // 1 get all product IDs from payload

    const productIds = payload.map((item) => item.productId);

    // 2. fetch all products from DB
    const products = await this.prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
    });

    for (const item of payload) {
      const product = products.find((p) => p.id === item.productId);

      if (!product) {
        throw new ApiError(
          "Product with id " + item.productId + " not found",
          400
        );
      }

      if (product.stock < item.qty) {
        throw new ApiError(
          "Product with id " + item.productId + " stock not enough",
          400
        );
      }

      const result = await this.prisma.$transaction(async (tx) => {
        // 4. Create data Transaction
        const transaction = await tx.transaction.create({
          data: { userId: authUserId }, // userID from token -> res.locals.user.id
          include: { user: true },
        });

        // 5. Prepare data TransactionDetail
        const transactionDetails = payload.map((item) => {
          const product = products.find((p) => p.id === item.productId)!;

          return {
            transactionId: transaction.id,
            productId: product.id,
            qty: item.qty,
            price: product.price,
          };
        });

        // 6. CreateMany data TransactionDetail based on variable transactionDetails
        await tx.transactionDetail.createMany({
          data: transactionDetails,
        });

        // 7. Update stock for each product
        for (const item of payload) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.qty } },
          });
        }
        return transaction;
      });

      //8. Buat delay job untuk mengecek status transaksi 1 menit
      await this.transactionQueue.addNewTransactionQueue(result.uuid);

      // 9. kirim email ke untuk upload bukti pembayaran
      await this.mailService.sendMail(
        result.user.email,
        "Upload bukti pembayaran",
        "upload-proof",
        {
          name: result.user.name,
          uuid: result.uuid,
          expireAt: new Date(result.createdAt.getTime() + 5 * 60 * 1000),
          year: new Date().getFullYear(),
        }
      );

      return { message: "create transaction success" };
    }
  };

  uploadPaymentProof = async (
    uuid: string,
    paymentProof: Express.Multer.File,
    authUserId: number
  ) => {
    //harus tau dulu transaksinya
    // harus user yang punya transaksi yang bisa upload payment proof

    // cari transaksi berdasarkan uuid
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid },
    });

    // kalau tidak ada throw error
    if (!transaction) {
      throw new ApiError("Transaction not found", 400);
    }

    // kalau userId di data transaksi nya tidak sesuai dengan userID di dalam
    // token throw error
    if (transaction.userId !== authUserId) {
      throw new ApiError("Unauthorised", 401);
    }

    //upload buti transfer ke cloudinary
    const { secure_url } = await this.cloudinaryService.upload(paymentProof);

    // update data di table transaction, ubah kolom paymentProof dan status
    await this.prisma.transaction.update({
      where: { uuid },
      data: { paymentProof: secure_url, status: "WAITING_FOR_CONFIRMATION" },
    });

    return { message: "upload payment proof success" };
  };

  updateTransaction = async (body: UpdateTransactionDTO) => {
    const transaction = await this.prisma.transaction.findFirst({
      where: { uuid: body.uuid },
    });

    if (!transaction) {
      throw new ApiError("Transaction not found", 400);
    }

    if (transaction.status !== "WAITING_FOR_CONFIRMATION") {
      throw new ApiError(
        "Transaction status must be WAITING_FOR_CONFIRMATION",
        400
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: { uuid: body.uuid },
        data: { status: body.type === "ACCEPT" ? "PAID" : "REJECT" },
      });

      if (body.type === "REJECT") {
        // balikin stock kembali semua

        const transactionDetails = await tx.transactionDetail.findMany(
          {
            where: { transactionId: transaction.id },
          }
        );

        for (const detail of transactionDetails) {
          await tx.product.update({
            where: { id: detail.productId },
            data: { stock: { increment: detail.qty } },
          });
        }
      }
    });

    return { message: "update transaction success" };
  };

  getTransactions = async () => {
    const transactions = await this.prisma.transaction.findMany({
      include: { user: true },
    });
    return transactions;
  };
    
}
