import { Queue } from "bullmq";
import { connection } from "../../config/redis";

export class TransactionQueue {
  private queue: Queue;
  constructor() {
    this.queue = new Queue("transactionQueue", { connection });
  }

  addNewTransactionQueue = async (uuid: string) => {
    return await this.queue.add(
      "newTransaction",
      { uuid: uuid }, // payload / isi data dalam antrian
      {
        jobId: uuid, //optional: mencegah duplikat
        delay: 5 * 60 * 1000, // optional: delay 5 *  1 menit:
        attempts: 5, // optional retry sampai 5 kali
        removeOnComplete: true, // optional: hapus data ketika selesai
        backoff: { type: "exponential", delay: 1000 },
      }
    );
  };
}
