# AI Customer Operations Hub

> A production-oriented, multi-tenant customer operations platform built with the MEAN stack, featuring CRM workflows, AI-assisted customer operations, real-time communication, background job processing, secure authentication, role-based access control, and webhook-driven integrations.

![Angular](https://img.shields.io/badge/Angular-20+-DD0031?style=flat-square&logo=angular&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=flat-square&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8+-47A248?style=flat-square&logo=mongodb&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-Real--Time-010101?style=flat-square&logo=socket.io&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-7+-DC382D?style=flat-square&logo=redis&logoColor=white)
![BullMQ](https://img.shields.io/badge/BullMQ-Background%20Jobs-E34F26?style=flat-square)

---

## Overview

**AI Customer Operations Hub** is a full-stack, multi-tenant customer operations platform designed to centralize customer conversations, contacts, tickets, AI-assisted workflows, and operational activity in a single application.

The platform is built using the **MEAN stack** with additional infrastructure for real-time communication and asynchronous background processing.

The project focuses on production-oriented engineering concepts including:

- Multi-tenant architecture
- Secure authentication and authorization
- REST API development
- Real-time event-driven communication
- Background job processing
- AI agent tool execution
- Webhook processing
- Retry and failure handling
- Audit logging
- System health monitoring

---

# Features

## Multi-Tenant CRM

The application supports organization-based customer operations.

Each authenticated user belongs to an organization, and organization-scoped resources are isolated at the backend level.

The platform manages:

- Organizations
- Users
- Contacts
- Tickets
- Conversations
- AI agent configurations
- Audit logs

---

## Authentication & Authorization

The backend uses JWT-based authentication and role-based authorization.

### Security features

- JWT authentication
- Protected API routes
- Password hashing
- Role-based access control
- Organization-level authorization
- Authenticated Socket.IO connections
- Backend-side authorization for AI tools

### Authentication flow

```text
User
  |
  v
Login / Register
  |
  v
JWT Token
  |
  v
Authenticated Request
  |
  v
Backend Authorization
  |
  v
Organization-Scoped Resource
Customer & Contact Management

The CRM provides centralized customer management.

Supported operations include:

Create contacts
View contacts
Update contacts
Track customer status
Retrieve customer information
Access customer-related conversations and tickets

All contact operations are scoped to the authenticated organization.

Ticket Management

Customer issues can be converted into structured support tickets.

Tickets support:

Title
Description
Priority
Status
Customer association
Organization association

The AI agent can also create tickets through controlled backend tools.

Example
Customer
"I have a payment problem."

        |
        v

AI Agent
        |
        v

create_ticket
        |
        v

Backend Validation
        |
        v

MongoDB
        |
        v

Ticket Created
Shared Customer Inbox

The platform provides a centralized conversation inbox for customer operations.

The inbox supports:

Conversation history
Customer messages
Sending messages
Creating conversations
Real-time updates
Customer context

Conversation data is persisted in MongoDB and associated with the appropriate organization.

Real-Time Communication

Real-time application updates are implemented using Socket.IO.

Supported events include:

New conversations
New messages
Typing events
Inbox updates
Connection status

Authenticated Socket.IO clients are placed into organization-specific rooms.

Angular Client
      |
      | JWT
      v
Socket.IO Server
      |
      v
JWT Verification
      |
      v
Organization Identification
      |
      v
Organization Room

Example room:

org:<organizationId>

This keeps real-time events isolated between organizations.

AI Agent

The platform includes an AI-agent architecture designed around backend tool execution.

Available tools include:

create_ticket
schedule_meeting
update_contact
get_customer_history

The AI layer separates:

Intent detection
Tool selection
Backend authorization
Business operations
Database operations
Background processing
AI architecture
User Message
      |
      v
AI Agent
      |
      v
Intent Detection
      |
      v
Tool Selection
      |
      v
Backend Authorization
      |
      +-----------------------+
      |           |           |
      v           v           v
 create       update       history
 ticket       contact      lookup
      |           |           |
      +-----------+-----------+
                  |
                  v
              Backend
                  |
                  v
               MongoDB

The architecture is designed so that additional LLM providers and tools can be integrated without moving business logic into the frontend.

Background Job Processing

The application uses Redis and BullMQ for asynchronous background processing.

Background jobs allow potentially slow operations to be processed outside the main HTTP request lifecycle.

Processing flow
API Request
     |
     v
Create Job
     |
     v
BullMQ
     |
     v
Redis
     |
     v
Background Worker
     |
     v
Process Operation

The queue system supports:

Job retries
Exponential backoff
Worker concurrency
Completed job handling
Failed job handling
Asynchronous message processing
Meeting scheduling workflows
Current job types
conversation-created
whatsapp-inbound
schedule-meeting
WhatsApp Webhook Integration

The backend provides WhatsApp webhook endpoints for receiving inbound customer messages.

Message flow
WhatsApp
    |
    v
Webhook
    |
    v
Contact Lookup / Creation
    |
    v
Conversation Lookup / Creation
    |
    v
BullMQ
    |
    v
Background Worker
    |
    v
Socket.IO
    |
    v
Angular Inbox

The webhook also supports WhatsApp verification requests.

Audit Logging

The application includes an audit-log system for operational activity.

Audit logging provides a foundation for:

Operational traceability
Administrative visibility
Debugging
Security monitoring
Future compliance workflows

Audit records are associated with the relevant organization and authenticated user context.

Agent Configuration

Organizations can configure their AI agent.

Agent configuration includes:

Greeting
Guardrails
Enabled tools
Organization association

Available tools can be controlled through the agent configuration rather than allowing every operation to execute unconditionally.

System Health

The application includes system-health functionality for monitoring application dependencies and operational state.

The dashboard provides visibility into the current application environment and connected services.

Architecture
                         ┌──────────────────────┐
                         │      Angular UI      │
                         │      TypeScript      │
                         └──────────┬───────────┘
                                    |
                         REST API / Socket.IO
                                    |
                                    v
                         ┌──────────────────────┐
                         │   Node.js + Express  │
                         │      API Layer       │
                         └──────────┬───────────┘
                                    |
              ┌─────────────────────┼─────────────────────┐
              |                     |                     |
              v                     v                     v
       ┌─────────────┐       ┌─────────────┐       ┌─────────────┐
       │   MongoDB   │       │ Redis/BullMQ│       │  AI Agent   │
       │   Database  │       │    Queue    │       │ Tool Layer  │
       └─────────────┘       └──────┬──────┘       └─────────────┘
                                    |
                                    v
                             ┌─────────────┐
                             │   Workers   │
                             │ Background  │
                             │    Jobs     │
                             └─────────────┘
Technology Stack
Frontend
Angular
TypeScript
Socket.IO Client
HTML
CSS
Angular Forms
Backend
Node.js
Express.js
TypeScript
JWT
Socket.IO
Mongoose
Database & Infrastructure
MongoDB
Redis
BullMQ
Memurai for Windows Redis-compatible development
Development Tools
Git
GitHub
npm
VS Code
PowerShell
Project Structure
ai-customer-operations-hub/
│
├── client/
│   ├── src/
│   │   └── main.ts
│   ├── package.json
│   └── ...
│
├── server/
│   ├── src/
│   │   ├── ai.ts
│   │   ├── auth.ts
│   │   ├── config.ts
│   │   ├── index.ts
│   │   ├── models.ts
│   │   ├── queue.ts
│   │   ├── routes.ts
│   │   └── seed.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   └── screenshots/
│       ├── dashboard.png
│       ├── inbox.png
│       ├── contacts.png
│       ├── tickets.png
│       ├── analytics.png
│       ├── ai-agent.png
│       ├── audit-logs.png
│       └── system-health.png
│
├── .gitignore
└── README.md
API Structure

The backend follows a REST-oriented API architecture.

Major API areas include:

/api/auth/*
/api/contacts/*
/api/tickets/*
/api/conversations/*
/api/ai/*
/api/agent/*
/api/audit/*
/api/admin/*
/api/webhooks/whatsapp

Protected resources require JWT authentication.

Organization-scoped resources use the authenticated user's organization context when accessing or modifying data.

Data Isolation

Multi-tenancy is enforced at the backend layer.

JWT
 |
 v
Authenticated User
 |
 v
organizationId
 |
 v
Database Query
 |
 v
Organization-Scoped Data

This architecture prevents normal authenticated requests from accessing resources belonging to another organization.

Reliability Design

The project incorporates several reliability-oriented patterns.

Retry Handling

Background jobs are configured with retry attempts.

Exponential Backoff

Failed jobs can be retried with increasing delays.

Asynchronous Processing

Slow or integration-dependent operations can be moved to background workers.

Real-Time Isolation

Socket.IO organization rooms prevent unrelated organizations from receiving each other's events.

Backend Authorization

AI tools execute through backend-controlled operations rather than trusting the frontend.

# Screenshots

## Dashboard
<img width="945" height="414" alt="dashboard overview" src="https://github.com/user-attachments/assets/b4e94cfc-d957-419a-b26c-db7e2451318d" />


## Customer Inbox
<img width="694" height="386" alt="inbox (1)" src="https://github.com/user-attachments/assets/e8ab72d1-4a16-40b4-a805-b8864b0fbeb9" />


## Contacts
<img width="943" height="417" alt="contacts" src="https://github.com/user-attachments/assets/e8c1a64e-7566-4268-ab3d-3cd2b4463df8" />


## Tickets
<img width="943" height="417" alt="contacts" src="https://github.com/user-attachments/assets/62763a3c-9a07-4082-8cec-37c0b9d0304b" />


## Analytics
<img width="724" height="416" alt="analytics (1)" src="https://github.com/user-attachments/assets/3a79e144-ea86-4c02-b8e3-cd2578a3c3b0" />


## AI Agent

<img width="422" height="245" alt="AI Agent (1)" src="https://github.com/user-attachments/assets/106fde70-8604-4d4c-8833-10d8312d7d7b" />

## Audit Logs
<img width="940" height="418" alt="audit logs" src="https://github.com/user-attachments/assets/7bdead52-0b1e-4f8e-b8a6-216f6dc87171" />


## System Health
<img width="734" height="293" alt="system health 2" src="https://github.com/user-attachments/assets/33a48600-0885-4507-a3e2-c98540fc3f40" />


Local Development
Prerequisites

Install:

Node.js 20+
npm
MongoDB
Redis-compatible service

For Windows development, Memurai can be used as the Redis-compatible service.

1. Clone the Repository
git clone https://github.com/MalothSravani/ai-customer-operations-hub.git

cd ai-customer-operations-hub
2. Install Backend Dependencies
cd server
npm install
3. Configure Environment Variables

Create:

server/.env

Example:

PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/ai_customer_ops
JWT_SECRET=your_jwt_secret
CLIENT_URL=http://localhost:4200
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
WHATSAPP_VERIFY_TOKEN=your_whatsapp_verify_token

Never commit .env files, API keys, JWT secrets, database credentials, or production tokens to GitHub.

4. Start the Backend

From the server directory:

npm run dev

Backend:

http://localhost:4000
5. Install Frontend Dependencies

Open another terminal:

cd client
npm install
6. Start Angular
npm start

Frontend:

http://localhost:4200
Development Flow
                    Browser
                       |
                       v
                Angular Application
                       |
              +--------+--------+
              |                 |
              v                 v
          REST API          Socket.IO
              |                 |
              +--------+--------+
                       |
                       v
                Express Server
                       |
          +------------+------------+
          |            |            |
          v            v            v
      MongoDB       Redis        AI Agent
                       |
                       v
                    BullMQ
                       |
                       v
                    Workers
Engineering Decisions
Why MongoDB?

MongoDB provides a flexible document-oriented data model suitable for:

Contacts
Conversations
Tickets
Agent configurations
Audit logs
Organization data
Why Socket.IO?

Customer operations benefit from immediate updates for:

Incoming messages
New conversations
Typing indicators
Inbox activity

Socket.IO provides an event-driven communication layer for these workflows.

Why Redis + BullMQ?

Background processing prevents slow or external operations from unnecessarily blocking API requests.

BullMQ provides:

Queuing
Retries
Delayed jobs
Worker concurrency
Failure handling

Redis provides the infrastructure required for queue management and worker coordination.

Why TypeScript?

TypeScript provides static typing across the frontend and backend and improves maintainability as the application grows.

Production Considerations

The current implementation is designed as a production-oriented portfolio project and provides a foundation for additional production hardening.

Potential production improvements include:

Docker containerization
CI/CD pipelines
AWS deployment
Redis caching
API rate limiting
Automated API testing
Distributed worker deployment
Centralized logging
Metrics and alerting
Database performance monitoring
Production LLM provider integration
Production WhatsApp outbound messaging
Additional third-party integrations
Future Enhancements

Planned extensions include:

Production LLM integration
Advanced function/tool calling
Google Calendar integration
Google Sheets integration
Meta Lead Forms integration
WhatsApp outbound messaging
Campaign management
Advanced analytics
Customer segmentation
Automated testing
Docker deployment
CI/CD with GitHub Actions
AWS deployment
Redis caching
API rate limiting
Distributed worker scaling
Project Goals

This project was built to demonstrate practical full-stack engineering capabilities across:

MEAN stack development
REST API design
Multi-tenant architecture
Authentication and authorization
Real-time systems
Event-driven architecture
Background job processing
AI agent architecture
Webhook integrations
Database modeling
Backend security
Reliability engineering
Scalable system design

The goal is to demonstrate ownership across the complete application lifecycle, from frontend development and API design to database operations, asynchronous workers, authentication, and real-time communication.

Security

This repository intentionally excludes environment files and sensitive credentials.

The following should never be committed:

.env
.env.*
API keys
JWT secrets
Database credentials
OAuth credentials
Production tokens

Use environment variables for local and production configuration.

Repository

GitHub:

https://github.com/MalothSravani/ai-customer-operations-hub

Author

Maloth Sravani

National Institute of Technology, RourkelaS

GitHub:
https://github.com/MalothSravani
