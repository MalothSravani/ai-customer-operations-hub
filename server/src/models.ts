import mongoose, { Schema } from "mongoose";

const Organization = mongoose.model("Organization", new Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}));

const User = mongoose.model("User", new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["owner", "admin", "agent", "viewer"], default: "agent" }
}));

const Contact = mongoose.model("Contact", new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: String,
  phone: String,
  email: String,
  status: { type: String, default: "lead" },
  createdAt: { type: Date, default: Date.now }
}));

const Ticket = mongoose.model("Ticket", new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
  title: { type: String, required: true },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  createdAt: { type: Date, default: Date.now }
}));

const Conversation = mongoose.model("Conversation", new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  contactId: { type: Schema.Types.ObjectId, ref: "Contact" },
  channel: { type: String, enum: ["whatsapp", "web"], default: "web" },
  status: { type: String, enum: ["open", "closed"], default: "open" },
  messages: [{
    direction: { type: String, enum: ["inbound", "outbound"] },
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  updatedAt: { type: Date, default: Date.now }
}));

const AgentConfig = mongoose.model("AgentConfig", new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    unique: true,
    index: true
  },
  greeting: {
    type: String,
    default: "Hi! How can I help you today?"
  },
  guardrails: {
    type: String,
    default: "Do not expose private customer data."
  },
  tools: {
    type: [String],
    default: [
      "create_ticket",
      "schedule_meeting",
      "update_contact",
      "get_customer_history"
    ]
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}));

const AIConversation = mongoose.model("AIConversation", new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true
  },
  title: {
    type: String,
    default: "AI Operations Session"
  },
  messages: [{
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    tool: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}));

const AuditLog = mongoose.model("AuditLog", new Schema({
  organizationId: {
    type: Schema.Types.ObjectId,
    ref: "Organization",
    required: true,
    index: true
  },
  actor: {
    type: String,
    default: "system"
  },
  action: {
    type: String,
    required: true
  },
  resource: String,
  details: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    enum: ["success", "failed"],
    default: "success"
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}));

export {
  Organization,
  User,
  Contact,
  Ticket,
  Conversation,
  AgentConfig,
  AIConversation,
  AuditLog
};
