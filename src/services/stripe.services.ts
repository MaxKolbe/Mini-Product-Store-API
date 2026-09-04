import Stripe from "stripe";
import logger from "../configs/logger.config.js";
import { LineItems } from "../types/checkout.js";
import { env } from "../configs/env.config.js";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const createSession = async (lineItems: LineItems, customerEmail: string) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${env.API_BASE_URL}/api/checkout?success=true`,
    });

    return session;
  } catch (error: unknown) {
    if (error instanceof stripe.errors.StripeError) {
      switch (error.type) {
        case "StripeCardError":
          logger.error(`declined card error for ${customerEmail}`, {
            status: error.statusCode,
            code: error.code,
            message: error.message,
            requestId: error.requestId,
          });
          throw error;
        case "StripeRateLimitError":
          logger.error("Too many requests made to the API too quickly", {
            customerEmail,
            requestId: error.requestId,
          });
          throw error;
        case "StripeInvalidRequestError":
          logger.error("Invalid parameters were supplied to Stripe's API", {
            message: error.message,
            requestId: error.requestId,
          });
          throw error;
        case "StripeAPIError":
          logger.error("An error occurred internally with Stripe's API", {
            requestId: error.requestId,
          });
          throw error;
        case "StripeConnectionError":
          logger.error("Some kind of error occurred during the HTTPS communication", {
            requestId: error.requestId,
          });
          throw error;
        case "StripeAuthenticationError":
          logger.error("StripeAuthenticationerror", {
            requestId: error.requestId,
            note: "You probably used an incorrect API key",
          });
          throw error;
        default:
          logger.error(`Stripe Error`, {
            status: error.statusCode,
            code: error.code,
            message: error.message,
            requestId: error.requestId,
          });
          throw error;
      }
    }
    throw error;
  }
};
