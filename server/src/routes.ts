import { Router } from "express";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { z } from "zod";

import {
  Organization,
  User,
  Contact,
  Ticket,
  Conversation,
  AgentConfig,
  AIConversation,
  AuditLog
} from "./models";

import {
  auth,
  requireRole,
  signToken
} from "./auth";

import {
  executeTool,
  runAgent
} from "./ai";

import { messageQueue } from "./queue";
import { config } from "./config";

export const router = Router();

/*
 * =========================================================
 * PUBLIC ROUTES
 * =========================================================
 */

/*
 * HEALTH CHECK
 */
router.get("/health", async (_, res) => {
  let redis = "unknown";
  let queue = "unknown";

  try {
    await messageQueue.waitUntilReady();
    redis = "connected";
    const counts = await messageQueue.getJobCounts(
      "waiting",
      "active",
      "completed",
      "failed"
    );
    queue = "running";

    const mongo =
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected";

    res.json({
      ok: mongo === "connected" && redis === "connected",
      service: "ai-customer-operations-hub",
      services: {
        api: "healthy",
        mongodb: mongo,
        redis,
        bullmq: queue,
        socketio: "available"
      },
      queue: counts
    });
  } catch (error) {
    const mongo =
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected";

    res.status(503).json({
      ok: false,
      service: "ai-customer-operations-hub",
      services: {
        api: "healthy",
        mongodb: mongo,
        redis,
        bullmq: queue,
        socketio: "available"
      },
      error:
        error instanceof Error
          ? error.message
          : "Health check failed"
    });
  }
});


/*
 * REGISTER
 */
router.post("/auth/register", async (req, res) => {
  try {
    const body = z
      .object({
        organization: z.string().min(2),
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8)
      })
      .parse(req.body);

    const organization = await Organization.create({
      name: body.organization
    });

    const passwordHash = await bcrypt.hash(
      body.password,
      12
    );

    const user = await User.create({
      organizationId: organization._id,
      name: body.name,
      email: body.email,
      passwordHash,
      role: "owner"
    });

    const token = signToken({
      userId: String(user._id),
      organizationId: String(organization._id),
      role: user.role
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Register error:", error);

    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Registration failed"
    });
  }
});


/*
 * LOGIN
 */
router.post("/auth/login", async (req, res) => {
  try {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string()
      })
      .parse(req.body);

    const user = await User.findOne({
      email: body.email
    });

    if (
      !user ||
      !(await bcrypt.compare(
        body.password,
        user.passwordHash
      ))
    ) {
      return res.status(401).json({
        message: "Invalid credentials"
      });
    }

    const token = signToken({
      userId: String(user._id),
      organizationId: String(user.organizationId),
      role: user.role
    });

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error("Login error:", error);

    res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Login failed"
    });
  }
});


/*
 * =========================================================
 * PUBLIC WHATSAPP WEBHOOKS
 * =========================================================
 *
 * Demo-friendly inbound flow:
 * Meta/simple webhook payload:
 * {
 *   organizationId: "...",
 *   from: "919999999999",
 *   name: "Customer",
 *   text: "Hello"
 * }
 *
 * In production, organizationId should be resolved from the
 * WhatsApp phone-number ID instead of being supplied by the
 * webhook body.
 */

/*
 * META WEBHOOK VERIFICATION
 */
router.get(
  "/webhooks/whatsapp",
  (req, res) => {

    const {
      "hub.mode": mode,
      "hub.verify_token": token,
      "hub.challenge": challenge
    } = req.query;

    if (
      mode === "subscribe" &&
      token === config.whatsappVerifyToken
    ) {
      return res
        .status(200)
        .send(challenge);
    }

    return res.sendStatus(403);
  }
);


/*
 * WHATSAPP INBOUND MESSAGE
 */
router.post(
  "/webhooks/whatsapp",
  async (req, res) => {

    try {

      const organizationId =
        String(req.body?.organizationId || "");

      const phone =
        String(req.body?.from || "");

      const name =
        String(req.body?.name || "WhatsApp Customer");

      const messageText =
        String(req.body?.text || "").trim();

      if (
        !organizationId ||
        !phone ||
        !messageText
      ) {
        return res.status(400).json({
          message:
            "organizationId, from and text are required"
        });
      }

      /*
       * Find or create the contact inside this tenant.
       */
      let contact =
        await Contact.findOne({
          organizationId,
          phone
        });

      if (!contact) {
        contact =
          await Contact.create({
            organizationId,
            name,
            phone,
            status: "lead"
          });
      }

      /*
       * Find an open WhatsApp conversation or create one.
       */
      let conversation =
        await Conversation.findOne({
          organizationId,
          contactId: contact._id,
          channel: "whatsapp",
          status: "open"
        });

      if (!conversation) {
        conversation =
          await Conversation.create({
            organizationId,
            contactId: contact._id,
            channel: "whatsapp",
            status: "open",
            messages: [],
            updatedAt: new Date()
          });
      }

      conversation.messages.push({
        direction: "inbound",
        text: messageText,
        createdAt: new Date()
      } as any);

      conversation.updatedAt =
        new Date();

      await conversation.save();

      /*
       * Queue the inbound event for background processing.
       */
      await messageQueue.add(
        "whatsapp-inbound",
        {
          organizationId,
          conversationId:
            String(conversation._id),
          contactId:
            String(contact._id),
          phone,
          text: messageText
        }
      );

      await AuditLog.create({
        organizationId,
        actor: "whatsapp",
        action: "whatsapp_message_received",
        resource: "Conversation",
        details: {
          conversationId: String(conversation._id),
          contactId: String(contact._id),
          phone,
          preview: messageText.slice(0, 120)
        },
        status: "success"
      });

      /*
       * Push the new message to the live inbox.
       */
      const io = req.app.locals.io;

      if (io) {
        io.to(`org:${organizationId}`).emit(
          "conversation:message",
          {
            conversationId:
              String(conversation._id),
            organizationId,
            contactId:
              String(contact._id),
            channel: "whatsapp",
            direction: "inbound",
            text: messageText,
            createdAt:
              new Date()
          }
        );
      }

      return res.status(200).json({
        ok: true,
        conversationId:
          conversation._id,
        contactId:
          contact._id,
        queued: true
      });

    } catch (error) {

      console.error(
        "WhatsApp webhook error:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to process WhatsApp webhook",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error"
      });
    }
  }
);


/*
 * =========================================================
 * AUTHENTICATION
 * Everything below this line requires JWT
 * =========================================================
 */

router.use(auth);


/*
 * =========================================================
 * AUDIT LOGS
 * =========================================================
 */
router.get("/audit-logs", async (req, res) => {
  try {
    const organizationId =
      (req as any).user.organizationId;

    const logs = await AuditLog.find({
      organizationId
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(logs);
  } catch (error) {
    res.status(500).json({
      message: "Failed to load audit logs"
    });
  }
});


/*
 * =========================================================
 * AI AGENT CONFIGURATION
 * =========================================================
 */

/*
 * GET AI AGENT CONFIG
 */
router.get("/agent-config", async (req, res) => {
  try {
    const organizationId =
      (req as any).user.organizationId;

    let agentConfig = await AgentConfig.findOne({
      organizationId
    });

    if (!agentConfig) {
      agentConfig = await AgentConfig.create({
        organizationId
      });
    }

    res.json(agentConfig);

  } catch (error) {
    console.error(
      "Get agent config error:",
      error
    );

    res.status(500).json({
      message: "Failed to load agent configuration",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
});


/*
 * SAVE AI AGENT CONFIG
 */
router.post("/agent-config", async (req, res) => {
  try {
    const organizationId =
      (req as any).user.organizationId;

    const body = z
      .object({
        greeting: z
          .string()
          .min(1)
          .max(500)
          .optional(),

        guardrails: z
          .string()
          .max(2000)
          .optional(),

        tools: z
          .array(z.string())
          .optional()
      })
      .parse(req.body);

    const agentConfig =
      await AgentConfig.findOneAndUpdate(
        {
          organizationId
        },
        {
          organizationId,
          ...body,
          updatedAt: new Date()
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
          runValidators: true
        }
      );

    await AuditLog.create({
      organizationId,
      actor: "user",
      action: "agent_config_updated",
      resource: "AgentConfig",
      details: {
        tools: agentConfig?.tools || []
      },
      status: "success"
    });

    res.json({
      ok: true,
      message: "AI agent configuration saved",
      agentConfig
    });

  } catch (error) {
    console.error(
      "Save agent config error:",
      error
    );

    res.status(400).json({
      message: "Failed to save agent configuration",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
});




/*
 * =========================================================
 * AI AGENT
 * =========================================================
 */

router.post("/ai/chat", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      return res.status(400).json({
        message: "A non-empty message is required"
      });
    }

    const organizationId =
      (req as any).user.organizationId;

    let session = sessionId
      ? await AIConversation.findOne({
          _id: sessionId,
          organizationId
        })
      : null;

    if (!session) {
      session = await AIConversation.create({
        organizationId,
        title: "AI Operations Session",
        messages: []
      });
    }

    session.messages.push({
      role: "user",
      content: message.trim(),
      createdAt: new Date()
    } as any);

    const result = await runAgent(
      message,
      organizationId
    );

    session.messages.push({
      role: "assistant",
      content: result.message || "Operation completed.",
      tool: result.tool,
      createdAt: new Date()
    } as any);

    session.updatedAt = new Date();
    await session.save();

    res.json({
      ...result,
      sessionId: String(session._id),
      history: session.messages.slice(-20)
    });

  } catch (error) {
    console.error("AI chat error:", error);

    res.status(500).json({
      message: "AI agent failed",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
});


/*
 * LOAD RECENT AI SESSION
 */
router.get("/ai/history", async (req, res) => {
  try {
    const organizationId =
      (req as any).user.organizationId;

    const session = await AIConversation.findOne({
      organizationId
    }).sort({ updatedAt: -1 });

    if (!session) {
      return res.json({
        sessionId: null,
        history: []
      });
    }

    res.json({
      sessionId: String(session._id),
      history: session.messages.slice(-20)
    });

  } catch (error) {
    console.error("AI history error:", error);

    res.status(500).json({
      message: "Failed to load AI history"
    });
  }
});


/*
 * =========================================================
 * CONTACTS
 * =========================================================
 */

/*
 * GET CONTACTS
 */
router.get("/contacts", async (req, res) => {
  try {
    const contacts = await Contact.find({
      organizationId:
        (req as any).user.organizationId
    }).sort({
      createdAt: -1
    });

    res.json(contacts);

  } catch (error) {
    console.error("Get contacts error:", error);

    res.status(500).json({
      message: "Failed to load contacts"
    });
  }
});


/*
 * CREATE CONTACT
 */
router.post("/contacts", async (req, res) => {
  try {
    const contact = await Contact.create({
      ...req.body,
      organizationId:
        (req as any).user.organizationId
    });

    res.status(201).json(contact);

  } catch (error) {
    console.error("Create contact error:", error);

    res.status(500).json({
      message: "Failed to create contact"
    });
  }
});


/*
 * =========================================================
 * TICKETS
 * =========================================================
 */

/*
 * GET TICKETS
 */
router.get("/tickets", async (req, res) => {
  try {
    const tickets = await Ticket.find({
      organizationId:
        (req as any).user.organizationId
    }).sort({
      createdAt: -1
    });

    res.json(tickets);

  } catch (error) {
    console.error("Get tickets error:", error);

    res.status(500).json({
      message: "Failed to load tickets"
    });
  }
});


/*
 * CREATE TICKET
 */
router.post("/tickets", async (req, res) => {
  try {
    const ticket = await Ticket.create({
      ...req.body,
      organizationId:
        (req as any).user.organizationId
    });

    res.status(201).json(ticket);

  } catch (error) {
    console.error("Create ticket error:", error);

    res.status(500).json({
      message: "Failed to create ticket"
    });
  }
});


/*
 * =========================================================
 * CONVERSATIONS
 * =========================================================
 */

/*
 * GET CONVERSATIONS
 */
router.get("/conversations", async (req, res) => {
  try {
    const conversations = await Conversation.find({
      organizationId:
        (req as any).user.organizationId
    }).sort({
      updatedAt: -1
    });

    res.json(conversations);

  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    res.status(500).json({
      message: "Failed to load conversations"
    });
  }
});


/*
 * CREATE CONVERSATION
 *
 * 1. Saves to MongoDB
 * 2. Adds BullMQ job
 * 3. Emits Socket.IO event
 * 4. Sends event only to same organization
 */
router.post("/conversations", async (req, res) => {
  try {
    const organizationId =
      (req as any).user.organizationId;

    const conversation =
      await Conversation.create({
        ...req.body,
        organizationId
      });


    /*
     * Background processing
     */
    await messageQueue.add(
      "conversation-created",
      {
        conversationId:
          conversation._id,
        organizationId
      }
    );


    /*
     * REAL-TIME EVENT
     */
    const io = req.app.locals.io;

    if (io) {
      console.log(
        "Emitting conversation:new to:",
        `org:${organizationId}`
      );

      io
        .to(`org:${organizationId}`)
        .emit(
          "conversation:new",
          conversation
        );
    }


    res.status(201).json(
      conversation
    );

  } catch (error) {
    console.error(
      "Conversation creation error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to create conversation",
      error:
        error instanceof Error
          ? error.message
          : "Unknown error"
    });
  }
});


/*
 * =========================================================
 * SEND MESSAGE FROM LIVE INBOX
 * =========================================================
 *
 * Angular will call:
 *
 * POST
 * /api/conversations/:conversationId/messages
 *
 * Example body:
 *
 * {
 *   "text": "Hello, how can I help you?"
 * }
 *
 * This:
 *
 * 1. Finds conversation
 * 2. Verifies organization
 * 3. Saves outbound message
 * 4. Updates timestamp
 * 5. Broadcasts Socket.IO event
 */
router.post(
  "/conversations/:conversationId/messages",
  async (req, res) => {
    try {
      const organizationId = (req as any).user.organizationId;
      const conversationId = req.params.conversationId;
      const { text } = req.body;

      if (typeof text !== "string" || text.trim().length === 0) {
        return res.status(400).json({
          message: "Message text is required"
        });
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        organizationId
      });

      if (!conversation) {
        return res.status(404).json({
          message: "Conversation not found"
        });
      }

      const newMessage = {
        direction: "outbound" as const,
        text: text.trim(),
        createdAt: new Date()
      };

      conversation.messages.push(newMessage);
      conversation.updatedAt = new Date();

      await conversation.save();

      const io = req.app.locals.io;

      if (io) {
        console.log(
          "Emitting conversation:message to:",
          `org:${organizationId}`
        );

        io.to(`org:${organizationId}`).emit(
          "conversation:message",
          {
            conversationId: String(conversation._id),
            organizationId,
            channel: conversation.channel,
            status: conversation.status,
            message: newMessage
          }
        );
      }

      return res.status(201).json({
        ok: true,
        message: "Message sent successfully",
        conversation
      });
    } catch (error) {
      console.error(
        "Send conversation message error:",
        error
      );

      return res.status(500).json({
        message: "Failed to send message",
        error:
          error instanceof Error
            ? error.message
            : "Unknown error"
      });
    }
  }
);


/*
 * =========================================================
 * DIRECT AI TOOL TESTING
 * =========================================================
 */

router.post(
  "/ai/tool-call",
  async (req, res) => {

    try {

      const {
        tool,
        args
      } = req.body;

      const result =
        await executeTool(
          tool,
          args || {},
          (req as any)
            .user
            .organizationId
        );

      res.json(result);

    } catch (error) {

      console.error(
        "AI tool error:",
        error
      );

      res.status(500).json({
        message:
          "Tool execution failed",

        error:
          error instanceof Error
            ? error.message
            : "Unknown error"
      });
    }
  }
);


/*
 * =========================================================
 * ADMIN USERS
 * =========================================================
 */

router.get(
  "/admin/users",

  requireRole(
    "owner",
    "admin"
  ),

  async (req, res) => {

    const users =
      await User.find({
        organizationId:
          (req as any)
            .user
            .organizationId
      }).select(
        "-passwordHash"
      );

    res.json(users);
  }
);