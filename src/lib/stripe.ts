import Stripe from "stripe";
import { env } from "../configs/env.config.js";

export const stripe = new Stripe(env.STRIPE_SECRET_KEY);