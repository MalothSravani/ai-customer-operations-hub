import {
  AgentConfig,
  Contact,
  Conversation,
  Ticket,
  AuditLog
} from "./models";
import { messageQueue } from "./queue";

export type ToolName =
  | "create_ticket"
  | "schedule_meeting"
  | "update_contact"
  | "get_customer_history";

/*
 * =========================================================
 * REAL CRM TOOLS
 * =========================================================
 */

export async function executeTool(
  tool: ToolName,
  args: Record<string, unknown>,
  organizationId: string
) {
  await AuditLog.create({
    organizationId,
    actor: "ai-agent",
    action: "tool_requested",
    resource: tool,
    details: args,
    status: "success"
  });

  // Enforce the organization's AI tool configuration server-side.
  // The UI checkboxes are only presentation; this prevents disabled
  // tools from being executed through direct API calls as well.
  const agentConfig = await AgentConfig.findOne({
    organizationId
  }).lean();

  const enabledTools = Array.isArray(agentConfig?.tools)
    ? agentConfig.tools
    : [
        "create_ticket",
        "schedule_meeting",
        "update_contact",
        "get_customer_history"
      ];

  if (!enabledTools.includes(tool)) {
    await AuditLog.create({
      organizationId,
      actor: "ai-agent",
      action: "tool_blocked",
      resource: tool,
      details: { reason: "tool_disabled" },
      status: "failed"
    });

    throw new Error(
      `AI tool "${tool}" is disabled for this organization`
    );
  }

  switch (tool) {
    /*
     * CREATE TICKET
     */
    case "create_ticket": {
      const title = String(
        args.title || "AI-created support ticket"
      );

      const priority =
        args.priority === "high" ||
        args.priority === "medium" ||
        args.priority === "low"
          ? args.priority
          : "medium";

      const contactId =
        typeof args.contactId === "string"
          ? args.contactId
          : undefined;

      if (contactId) {
        const contact = await Contact.findOne({
          _id: contactId,
          organizationId
        });

        if (!contact) {
          throw new Error(
            "Contact not found in this organization"
          );
        }
      }

      const ticket = await Ticket.create({
        organizationId,
        contactId,
        title,
        priority,
        status: "open"
      });

      return {
        ok: true,
        action: "create_ticket",
        ticket
      };
    }

    /*
     * UPDATE CONTACT
     */
    case "update_contact": {
      const contactId = String(args.contactId || "");

      if (!contactId) {
        throw new Error("contactId is required");
      }

      const updates: Record<string, unknown> = {};

      if (typeof args.name === "string") {
        updates.name = args.name;
      }

      if (typeof args.phone === "string") {
        updates.phone = args.phone;
      }

      if (typeof args.email === "string") {
        updates.email = args.email;
      }

      if (typeof args.status === "string") {
        updates.status = args.status;
      }

      const contact = await Contact.findOneAndUpdate(
        {
          _id: contactId,
          organizationId
        },
        updates,
        {
          new: true,
          runValidators: true
        }
      );

      if (!contact) {
        throw new Error(
          "Contact not found in this organization"
        );
      }

      return {
        ok: true,
        action: "update_contact",
        contact
      };
    }

    /*
     * CUSTOMER HISTORY
     */
    case "get_customer_history": {
      const contactId = String(args.contactId || "");

      if (!contactId) {
        throw new Error("contactId is required");
      }

      const contact = await Contact.findOne({
        _id: contactId,
        organizationId
      });

      if (!contact) {
        throw new Error(
          "Contact not found in this organization"
        );
      }

      const [tickets, conversations] = await Promise.all([
        Ticket.find({
          organizationId,
          contactId
        }).sort({ createdAt: -1 }),

        Conversation.find({
          organizationId,
          contactId
        }).sort({ updatedAt: -1 })
      ]);

      return {
        ok: true,
        action: "get_customer_history",
        contact,
        tickets,
        conversations
      };
    }

    /*
     * SCHEDULE MEETING
     */
    case "schedule_meeting": {
      const job = await messageQueue.add(
        "schedule-meeting",
        {
          organizationId,
          ...args
        }
      );

      return {
        ok: true,
        action: "schedule_meeting",
        status: "queued",
        jobId: job.id
      };
    }

    default:
      throw new Error("Unsupported tool");
  }
}


/*
 * =========================================================
 * LOCAL AI AGENT
 *
 * This version does NOT call OpenAI.
 * It uses simple intent detection and executes
 * the real CRM tools above.
 * =========================================================
 */

export async function runAgent(
  message: string,
  organizationId: string
) {
  const text = message.trim();
  const lower = text.toLowerCase();

  /*
   * -------------------------------------------------------
   * CREATE TICKET
   * -------------------------------------------------------
   */

  if (
    lower.includes("create") &&
    (
      lower.includes("ticket") ||
      lower.includes("issue") ||
      lower.includes("problem")
    )
  ) {
    let priority:
      | "low"
      | "medium"
      | "high" = "medium";

    if (lower.includes("high priority")) {
      priority = "high";
    } else if (lower.includes("low priority")) {
      priority = "low";
    }

    let title = "Customer support issue";

    if (lower.includes("payment")) {
      title = "Payment issue";
    } else if (lower.includes("login")) {
      title = "Login issue";
    } else if (lower.includes("refund")) {
      title = "Refund issue";
    } else if (lower.includes("delivery")) {
      title = "Delivery issue";
    } else if (lower.includes("account")) {
      title = "Account issue";
    }

    const result = await executeTool(
      "create_ticket",
      {
        title,
        priority
      },
      organizationId
    );

    return {
      ok: true,
      mode: "local-demo-agent",
      tool: "create_ticket",
      message:
        `I've created a ${priority}-priority ticket for "${title}".`,
      data: result.ticket
    };
  }


  /*
   * -------------------------------------------------------
   * CUSTOMER HISTORY
   * -------------------------------------------------------
   */

  if (
    lower.includes("history") ||
    lower.includes("previous tickets") ||
    lower.includes("customer information")
  ) {
    const contacts = await Contact.find({
      organizationId
    });

    const matchingContact = contacts.find(contact => {
      const name = (contact.name || "").toLowerCase();
      const phone = (contact.phone || "").toLowerCase();
      const email = (contact.email || "").toLowerCase();

      return (
        (name && lower.includes(name)) ||
        (phone && lower.includes(phone)) ||
        (email && lower.includes(email))
      );
    });

    if (!matchingContact) {
      return {
        ok: true,
        mode: "local-demo-agent",
        message:
          "I couldn't identify the customer. Please provide the customer's name, phone number, or email."
      };
    }
    const result = await executeTool(
  "get_customer_history",
  {
    contactId: String(matchingContact._id)
  },
  organizationId
);


/*
 * TypeScript does not know that the
 * get_customer_history result contains
 * tickets and conversations.
 *
 * We know this tool returns both.
 */

const historyResult = result as {
  ok: boolean;
  action: "get_customer_history";
  contact: any;
  tickets: any[];
  conversations: any[];
};


return {
  ok: true,
  mode: "local-demo-agent",
  tool: "get_customer_history",

  message:
    `${matchingContact.name} has ` +
    `${historyResult.tickets.length} ticket(s) and ` +
    `${historyResult.conversations.length} conversation(s).`,

  data: historyResult
};
}


  /*
   * -------------------------------------------------------
   * UPDATE CONTACT STATUS
   * -------------------------------------------------------
   */

  if (
    lower.includes("update") &&
    (
      lower.includes("contact") ||
      lower.includes("customer")
    )
  ) {
    const contacts = await Contact.find({
      organizationId
    });

    const matchingContact = contacts.find(contact => {
      const name = (contact.name || "").toLowerCase();

      return name && lower.includes(name);
    });

    if (!matchingContact) {
      return {
        ok: true,
        mode: "local-demo-agent",
        message:
          "I couldn't identify the contact. Please provide the customer's name."
      };
    }

    let status:
      | "lead"
      | "prospect"
      | "customer"
      | undefined;

    if (lower.includes("customer")) {
      status = "customer";
    } else if (lower.includes("prospect")) {
      status = "prospect";
    } else if (lower.includes("lead")) {
      status = "lead";
    }

    if (!status) {
      return {
        ok: true,
        mode: "local-demo-agent",
        message:
          "Please specify the new status: lead, prospect, or customer."
      };
    }

    const result = await executeTool(
      "update_contact",
      {
        contactId: String(matchingContact._id),
        status
      },
      organizationId
    );

    return {
      ok: true,
      mode: "local-demo-agent",
      tool: "update_contact",
      message:
        `Updated ${matchingContact.name}'s status to ${status}.`,
      data: result.contact
    };
  }


  /*
   * -------------------------------------------------------
   * SCHEDULE MEETING
   * -------------------------------------------------------
   */

  if (
    lower.includes("schedule") &&
    (
      lower.includes("meeting") ||
      lower.includes("call") ||
      lower.includes("appointment")
    )
  ) {
    const result = await executeTool(
      "schedule_meeting",
      {
        purpose: text
      },
      organizationId
    );

    return {
      ok: true,
      mode: "local-demo-agent",
      tool: "schedule_meeting",
      message:
        "I've queued the meeting request for background processing.",
      data: result
    };
  }


  /*
   * -------------------------------------------------------
   * HELP / UNKNOWN REQUEST
   * -------------------------------------------------------
   */

  return {
    ok: true,
    mode: "local-demo-agent",
    message:
      "I can help with tickets, customer history, contact updates, and meeting scheduling.",
    availableActions: [
      "Create a ticket",
      "Get customer history",
      "Update a contact",
      "Schedule a meeting"
    ]
  };
}