import Stripe from "stripe";
import logger from "../configs/logger.config.js";
import { LineItems } from "../types/checkout.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const createSession = async (lineItems: LineItems, customerEmail: string) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${process.env.API_BASE_URL}api/checkout?success=true`,
    });

    return session;
  } catch (error: any) {
    switch (error.type) {
      case "StripeCarderror":
        logger.error(`declined card error for ${customerEmail}`, {
          status: error.statusCode,
          code: error.code,
          message: error.message,
          requestId: error.requestId,
        });
        break;
      case "StripeRateLimiterror":
        logger.error("Too many requests made to the API too quickly", {
          customerEmail,
          requestId: error.requestId,
        });
        break;
      case "StripeInvalidRequesterror":
        logger.error("Invalid parameters were supplied to Stripe's API", {
          message: error.message,
          requestId: error.requestId,
        });
        break;
      case "StripeAPIerror":
        logger.error("An error occurred internally with Stripe's API", {
          requestId: error.requestId,
        });
        break;
      case "StripeConnectionerror":
        logger.error("Some kind of error occurred during the HTTPS communication", {
          requestId: error.requestId,
        });
        break;
      case "StripeAuthenticationerror":
        logger.error("StripeAuthenticationerror", {
          requestId: error.requestId,
          note: "You probably used an incorrect API key",
        });
        break;
      default:
        if (error instanceof stripe.errors.StripeError) {
          logger.error(`Stripe Error`, {
            status: error.statusCode,
            code: error.code,
            message: error.message,
            requestId: error.requestId,
          });
        } else {
          throw error;
        }
        break;
    }
  }
};
