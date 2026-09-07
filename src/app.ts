import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import requestLogger from "./middleware/requestLogger.middleware.js";
import errorHandler from "./middleware/errorHandler.middleware.js";
// import { connectRedis } from "./configs/cache.config.js";
import authRouter from "./routes/auth.routes.js";
import productsRouter from "./routes/products.routes.js";
import checkoutRouter from "./routes/checkout.routes.js";
import orderRouter from "./routes/orders.routes.js";
import webhookRouter from "./routes/webhook.routes.js";
import "./events/auth.events.js";
import "./events/orders.events.js";
import { env } from "./configs/env.config.js";

const app = express();

const whitelist = [`http://localhost:${env.PORT}`];
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allowed?: boolean) => void,
  ) {
    if (whitelist.indexOf(origin || "") !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  maxAge: 86400,
};

// Capture raw body for webhook routes BEFORE express.json()
// express.raw() already places a Buffer in req.body
app.use("/webhooks", express.raw({ type: "application/json" }), webhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(requestLogger);

// (async () => {
//   await connectRedis();
// })();

//ROUTES
app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/orders", orderRouter);

// HANDLER FOR UNKNOWN ROUTES
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { code: "NOT_FOUND", message: `Route ${req.path} not found` },
  });
});

//GLOBAL ERROR HANDLER
app.use(errorHandler);

export default app;
