//ROUTES
import { env } from "../configs/env.config.js";
import { stripe } from "../lib/stripe.js";
import { fulfillOrder } from "../services/order.services.js";
import logger from "../configs/logger.config.js";
import type Stripe from "stripe";
import express from "express";

const router = express.Router();

router.post("/stripe", async (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (typeof signature !== "string") {
    return res.status(400).json({
      message: "Missing Stripe signature",
    });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.error("Stripe webhook signature verification failed", {
      error,
    });

    return res.status(400).json({
      message: "Invalid webhook signature",
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        await fulfillOrder(session);
        break;
      }
      default:
        logger.info("Unhandled Stripe webhook event", {
          eventType: event.type,
        });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    logger.error("Stripe webhook processing failed", {
      eventId: event.id,
      error,
    });

    return res.status(500).json({ message: "Webhook processing failed" });
  }
});

export default router;
