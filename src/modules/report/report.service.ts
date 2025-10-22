import { PrismaService } from "../prisma/prisma.service";

export class ReportService {
  private prisma: PrismaService;
  constructor() {
    this.prisma = new PrismaService();
  }

  private dayRange(dateStr: string) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return { start, end };
  }

  getDailyReport = async (dateStr: string) => {
    const { start, end } = this.dayRange(dateStr);

    // Transactions of the day
    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { transactionItems: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totals = transactions.reduce(
      (acc: any, t: any) => {
        acc.count += 1;
        acc.totalAmount += t.totalAmount;
        if (t.paymentMethod === "CASH") acc.cashTotal += t.totalAmount;
        else acc.debitTotal += t.totalAmount;
        return acc;
      },
      { count: 0, totalAmount: 0, cashTotal: 0, debitTotal: 0 }
    );

    // Per item aggregation
    const perItemMap = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
    for (const t of transactions) {
      for (const it of t.transactionItems as any[]) {
        const key = it.productId;
        const name = it.product?.name ?? key;
        const prev = perItemMap.get(key) || { productId: key, name, quantity: 0, revenue: 0 };
        prev.quantity += it.quantity;
        prev.revenue += it.quantity * it.price;
        perItemMap.set(key, prev);
      }
    }
    const perItem = Array.from(perItemMap.values()).sort((a, b) => b.revenue - a.revenue);

    // Shifts summary (shifts started today)
    const shifts = await this.prisma.shift.findMany({
      where: { startTime: { gte: start, lt: end } },
      include: {
        transactions: true,
        cashier: true,
      },
      orderBy: { startTime: "asc" },
    });

    const shiftSummaries = shifts.map((s: any) => {
      const shiftTx = s.transactions as any[];
      const totalAmount = shiftTx.reduce((sum, t) => sum + t.totalAmount, 0);
      const cashTotal = shiftTx.filter((t) => t.paymentMethod === "CASH").reduce((sum, t) => sum + t.totalAmount, 0);
      const debitTotal = totalAmount - cashTotal;
      const totalCashReceived = shiftTx
        .filter((t) => t.paymentMethod === "CASH")
        .reduce((sum, t) => sum + ((t.cashAmount || 0) - (t.changeAmount || 0)), 0);
      const expectedCash = (s.startMoney || 0) + totalCashReceived;
      const hasEnd = typeof s.endMoney === "number" && s.endTime;
      const mismatch = hasEnd ? Math.abs((s.endMoney || 0) - expectedCash) > 0.01 : false;
      return {
        id: s.id,
        cashier: s.cashier ? { id: s.cashier.id, name: s.cashier.name, email: s.cashier.email } : null,
        startTime: s.startTime,
        endTime: s.endTime,
        startMoney: s.startMoney,
        endMoney: s.endMoney,
        expectedCash,
        mismatch,
        totals: { totalAmount, cashTotal, debitTotal },
      };
    });

    return { date: dateStr, totals, perItem, shifts: shiftSummaries };
  };

  getMismatchedShifts = async (startStr: string, endStr: string) => {
    const start = new Date(startStr); start.setHours(0,0,0,0);
    const end = new Date(endStr); end.setHours(23,59,59,999);

    const shifts = await this.prisma.shift.findMany({
      where: { endTime: { gte: start, lte: end } },
      include: { transactions: true, cashier: true },
      orderBy: { endTime: "desc" },
    });

    const results = shifts.map((s: any) => {
      const cashTx = (s.transactions as any[]).filter((t) => t.paymentMethod === "CASH");
      const totalCashReceived = cashTx.reduce((sum, t) => sum + ((t.cashAmount || 0) - (t.changeAmount || 0)), 0);
      const expectedCash = (s.startMoney || 0) + totalCashReceived;
      const mismatch = typeof s.endMoney === "number" ? Math.abs((s.endMoney || 0) - expectedCash) > 0.01 : false;
      return {
        id: s.id,
        cashier: s.cashier ? { id: s.cashier.id, name: s.cashier.name, email: s.cashier.email } : null,
        startTime: s.startTime,
        endTime: s.endTime,
        startMoney: s.startMoney,
        endMoney: s.endMoney,
        expectedCash,
        mismatch,
      };
    }).filter((x) => x.mismatch);

    return { start: startStr, end: endStr, shifts: results };
  };

  getSummaryReport = async (startStr: string, endStr: string) => {
    const start = new Date(startStr); start.setHours(0,0,0,0);
    const end = new Date(endStr); end.setHours(23,59,59,999);

    const transactions = await this.prisma.transaction.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { transactionItems: { include: { product: true } } },
      orderBy: { createdAt: "asc" },
    });

    const totals = transactions.reduce(
      (acc: any, t: any) => {
        acc.count += 1;
        acc.totalAmount += t.totalAmount;
        if (t.paymentMethod === "CASH") acc.cashTotal += t.totalAmount;
        else acc.debitTotal += t.totalAmount;
        return acc;
      },
      { count: 0, totalAmount: 0, cashTotal: 0, debitTotal: 0 }
    );

    const perItemMap = new Map<string, { productId: string; name: string; quantity: number; revenue: number }>();
    for (const t of transactions) {
      for (const it of (t as any).transactionItems as any[]) {
        const key = it.productId;
        const name = it.product?.name ?? key;
        const prev = perItemMap.get(key) || { productId: key, name, quantity: 0, revenue: 0 };
        prev.quantity += it.quantity;
        prev.revenue += it.quantity * it.price;
        perItemMap.set(key, prev);
      }
    }
    const perItem = Array.from(perItemMap.values()).sort((a, b) => b.revenue - a.revenue);

    return { start: startStr, end: endStr, totals, perItem };
  };
}
