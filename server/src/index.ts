import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import { config } from "./config";
import { router } from "./routes";
import "./queue";

interface AuthenticatedSocketData {
  userId: string;
  organizationId: string;
  email?: string;
}

async function main() {
  await mongoose.connect(config.mongoUri);

  console.log("MongoDB connected");

  const app = express();
  const httpServer = createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
      methods: ["GET", "POST"]
    }
  });

  app.use(
    cors({
      origin: config.clientUrl
    })
  );

  app.use(express.json());

  app.use("/api", router);

  /*
   * =====================================================
   * SOCKET.IO AUTHENTICATION
   * =====================================================
   *
   * The client must provide the JWT during the
   * Socket.IO handshake.
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Authentication required"));
      }

      const decoded = jwt.verify(
        token,
        config.jwtSecret
      ) as AuthenticatedSocketData;

      if (!decoded.userId || !decoded.organizationId) {
        return next(new Error("Invalid authentication token"));
      }

      socket.data.userId = decoded.userId;
      socket.data.organizationId = decoded.organizationId;
      socket.data.email = decoded.email;

      next();
    } catch (error) {
      console.error("Socket authentication failed:", error);
      next(new Error("Invalid authentication token"));
    }
  });

  /*
   * =====================================================
   * SOCKET.IO
   * =====================================================
   */

  io.on("connection", socket => {
    const organizationId = socket.data.organizationId;

    console.log(
      `Socket connected: ${socket.id} | Organization: ${organizationId}`
    );

    /*
     * Organization is taken from the authenticated JWT.
     * The client cannot choose another organization.
     */
    socket.join(`org:${organizationId}`);

    console.log(
      `Socket ${socket.id} joined organization ${organizationId}`
    );

    /*
     * Typing events are also restricted to the
     * authenticated organization.
     */
    socket.on("conversation:typing", payload => {
      socket
        .to(`org:${organizationId}`)
        .emit("conversation:typing", {
          ...payload,
          organizationId
        });
    });

    socket.on("disconnect", () => {
      console.log(
        `Socket disconnected: ${socket.id}`
      );
    });
  });

  /*
   * Make Socket.IO available inside Express routes.
   */
  app.locals.io = io;

  httpServer.listen(config.port, () => {
    console.log(
      `API listening on http://localhost:${config.port}`
    );
  });
}

main().catch(error => {
  console.error("Server startup failed:", error);
  process.exit(1);
});