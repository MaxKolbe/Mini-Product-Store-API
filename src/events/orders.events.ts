import ejs from "ejs"
import logger from "../configs/logger.config.js";
import { appEvents } from "../lib/events.js";
import { sendEmail } from "../utils/sendEmail.util.js";
import { OrderCreatedPayload } from "../types/orders.js";

export const ORDER_EVENTS = {
  ORDER_CREATED: "order:created",
} as const;


const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// SEND ORDER CONFIRMATION/RECEIPT EMAIL
appEvents.on(ORDER_EVENTS.ORDER_CREATED, async (data: OrderCreatedPayload) => {
  try {
    const content = await ejs.renderFile(
      process.cwd() + "/src/views/orderreceipt.ejs",
      {
        name: data.email.split("@")[0],
        orderId: data.orderId,
        amount: data.amount,
        items: data.items,
        createdAt: data.createdAt,
      },
      { async: true },
    );

    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const info = await sendEmail(data.email, "Your Order Confirmation", content);

        if (!info) {
          throw new Error("sendEmail returned no result");
        }

        logger.info("Order receipt email sent successfully", {
          orderId: data.orderId,
          email: data.email,
          attempt,
        });

        return;
      } catch (error: any) {
        lastError = error;

        if (attempt < MAX_RETRIES) {
          const delayMs = BASE_DELAY_MS * Math.pow(2, attempt - 1);

          logger.warn(`Order receipt email attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${delayMs}ms`, {
            orderId: data.orderId,
            email: data.email,
            message: error.message,
          });

          await delay(delayMs);
        }
      }
    }

    logger.error("Failed to send order receipt email after all retries", {
      orderId: data.orderId,
      email: data.email,
      message: lastError?.message,
      totalAttempts: MAX_RETRIES,
    });
  } catch (error: any) {
    logger.error("Failed to render order receipt template", {
      orderId: data.orderId,
      email: data.email,
      message: error.message,
    });
  }
});
