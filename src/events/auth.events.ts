import ejs from "ejs"
import logger from "../configs/logger.config.js";
import { appEvents } from "../lib/events.js";
import { sendEmail } from "../utils/sendEmail.util.js";

export const AUTH_EVENTS = {
  AUTH_SIGNUP: "auth:signup",
  AUTH_LOGIN: "auth:login",
  AUTH_LOGIN_FAIL: "auth:login-fail",
} as const;

// SEND WELCOME EMAIL ON USER SIGNUP
appEvents.on(AUTH_EVENTS.AUTH_SIGNUP, async (data) => {
  try {
    let content = await ejs.renderFile(
      process.cwd() + "/src/views/welcome.ejs",
      { name: data.email.split("@")[0] },
      { async: true },
    );

    const info = await sendEmail(data.email, "Welcome!", content);

    if (!info) {
      throw new Error();
    }

    logger.info("welcome email sent successully", {
      message: "new user registered successfully",
      userId: data.userId,
      correlationId: data.correlationId,
    });
  } catch (error: any) {
    logger.error("Failed to send welcome email", {
      email: data.email,
      message: error.message,
      correlationId: data.correlationId,
    });
  }
});

// LOG USER LOGIN
appEvents.on(AUTH_EVENTS.AUTH_LOGIN, async (data) => {
  logger.info("user logged in", {
    email: data.email,
    deviceInfo: data.deviceInfo,
    correlationId: data.correlationId,
  });
});

// LOG USER LOGIN FAIL
appEvents.on(AUTH_EVENTS.AUTH_LOGIN_FAIL, async (data) => {
  logger.info("user failed to log in", {
    email: data.email,
    reason: data.reason,
    deviceInfo: data.deviceInfo,
    correlationId: data.correlationId,
  });
});
