import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai_customer_ops",
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  clientUrl: process.env.CLIENT_URL || "http://localhost:4200",
  redis: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT || 6379)
  },
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "change_me"
};
