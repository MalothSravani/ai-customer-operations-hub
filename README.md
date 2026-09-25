# AI Customer Operations Hub

A full-stack, multi-tenant CRM and shared inbox starter built for demonstrating production-style MEAN engineering.

## Stack
- Angular + TypeScript
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Socket.IO
- Redis + BullMQ
- JWT authentication + RBAC
- WhatsApp webhook-ready integration
- LLM tool-calling service abstraction
- Google Calendar service abstraction

## Features
- Multi-tenant organizations
- JWT authentication
- Role-based access control
- Contacts and tickets
- Conversation inbox
- Real-time Socket.IO events
- Background job queue with BullMQ
- WhatsApp webhook endpoint
- AI tool-calling service abstraction
- Angular dashboard

## Important
This repository is a portfolio-ready engineering starter, not a claim of production deployment. External credentials and provider-specific setup are intentionally left in environment variables.

## Run
See `server/README.md` and `client/README.md`.

1. Start MongoDB and Redis.
2. Copy `server/.env.example` to `server/.env`.
3. Install server dependencies and run the API.
4. Install client dependencies and run Angular.
