import "zone.js";

import { bootstrapApplication } from "@angular/platform-browser";
import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import {
  HttpClient,
  provideHttpClient
} from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { io, Socket } from "socket.io-client";

const API_URL = "http://localhost:4000/api";
const SOCKET_URL = "http://localhost:4000";


@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule],

  template: `

    <!-- =====================================================
         LOGIN
    ====================================================== -->

    <div *ngIf="!token" class="login-page">

      <div class="login-card">

        <span class="eyebrow">
          AI CUSTOMER OPERATIONS HUB
        </span>

        <h1>Welcome back</h1>

        <p>Sign in to your workspace</p>

        <form (ngSubmit)="login()">

          <label>
            Email

            <input
              type="email"
              [(ngModel)]="email"
              name="email"
              required
            />
          </label>

          <label>
            Password

            <input
              type="password"
              [(ngModel)]="password"
              name="password"
              required
            />
          </label>

          <button
            class="primary"
            type="submit"
          >
            {{ loading ? "Signing in..." : "Sign In" }}
          </button>

          <p
            *ngIf="error"
            class="error"
          >
            {{ error }}
          </p>

        </form>

      </div>

    </div>


    <!-- =====================================================
         APPLICATION
    ====================================================== -->

    <main
      *ngIf="token"
      class="shell"
    >

      <!-- HEADER -->

      <header>

        <div>

          <span class="eyebrow">
            AI CUSTOMER OPERATIONS HUB
          </span>

          <h1>
            Shared Inbox & CRM
          </h1>

        </div>

        <div class="header-actions">

          <span class="status">
            ● API Connected
          </span>

          <span
            class="status"
            [style.background]="
              socketConnected
                ? '#e8f8ef'
                : '#fff1f1'
            "
            [style.color]="
              socketConnected
                ? '#166534'
                : '#991b1b'
            "
          >
            ●
            {{
              socketConnected
                ? "Real-time Connected"
                : "Real-time Offline"
            }}
          </span>

          <button
            class="logout"
            (click)="logout()"
          >
            Logout
          </button>

        </div>

      </header>


      <!-- MAIN GRID -->

      <section class="grid">

        <!-- SIDEBAR -->

        <aside class="panel">

          <h2>
            Workspace
          </h2>

          <button
            *ngFor="let item of nav"
            [class.active]="item === active"
            (click)="active = item"
          >
            {{ item }}
          </button>

        </aside>


        <!-- CONTENT -->

        <section class="panel content">

          <!-- TOOLBAR -->

          <div class="toolbar">

            <div>

              <h2>
                {{ active }}
              </h2>

              <p>
                Multi-tenant operations dashboard
              </p>

            </div>

            <button
              class="primary"
              (click)="loadData()"
            >
              Refresh
            </button>

          </div>


          <!-- =================================================
               OVERVIEW
          ================================================== -->

          <div
            *ngIf="active === 'Overview'"
            class="cards"
          >

            <div class="card">

              <b>
                {{ contacts.length }}
              </b>

              <span>
                Contacts
              </span>

            </div>

            <div class="card">

              <b>
                {{ tickets.length }}
              </b>

              <span>
                Tickets
              </span>

            </div>

            <div class="card">

              <b>
                {{ conversations.length }}
              </b>

              <span>
                Conversations
              </span>

            </div>

          </div>


          <!-- =================================================
               CONTACTS
          ================================================== -->

          <div
            *ngIf="active === 'Contacts'"
          >

            <div
              *ngIf="contacts.length === 0"
              class="empty"
            >
              No contacts found.
            </div>

            <div
              class="row"
              *ngFor="let c of contacts"
            >

              <b>
                {{ c.name || "Unnamed" }}
              </b>

              <span>
                {{ c.phone || c.email }}
              </span>

              <small>
                {{ c.status }}
              </small>

            </div>

          </div>


          <!-- =================================================
               TICKETS
          ================================================== -->

          <div
            *ngIf="active === 'Tickets'"
          >

            <div
              *ngIf="tickets.length === 0"
              class="empty"
            >
              No tickets found.
            </div>

            <div
              class="row"
              *ngFor="let t of tickets"
            >

              <b>
                {{ t.title }}
              </b>

              <span>
                {{ t.status }}
              </span>

              <small>
                {{ t.priority }}
              </small>

            </div>

          </div>


          <!-- =================================================
               ANALYTICS
          ================================================== -->

          <div
            *ngIf="active === 'Analytics'"
          >

            <div class="cards">

              <div class="card">
                <b>{{ contacts.length }}</b>
                <span>Total Contacts</span>
              </div>

              <div class="card">
                <b>{{ tickets.length }}</b>
                <span>Total Tickets</span>
              </div>

              <div class="card">
                <b>{{ conversations.length }}</b>
                <span>Conversations</span>
              </div>

              <div class="card">
                <b>{{ openTickets }}</b>
                <span>Open Tickets</span>
              </div>

            </div>

            <div
              style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 18px;
                margin-top: 20px;
              "
            >

              <div class="card">
                <h3>Ticket Status</h3>

                <p>
                  Open:
                  <strong>{{ openTickets }}</strong>
                </p>

                <p>
                  In Progress:
                  <strong>{{ inProgressTickets }}</strong>
                </p>

                <p>
                  Resolved:
                  <strong>{{ resolvedTickets }}</strong>
                </p>
              </div>

              <div class="card">
                <h3>Conversation Channels</h3>

                <p>
                  Web:
                  <strong>{{ webConversations }}</strong>
                </p>

                <p>
                  WhatsApp:
                  <strong>{{ whatsappConversations }}</strong>
                </p>
              </div>

            </div>

            <div class="card" style="margin-top: 20px;">
              <h3>Customer Status</h3>

              <p>
                Leads:
                <strong>{{ leadContacts }}</strong>
              </p>

              <p>
                Prospects:
                <strong>{{ prospectContacts }}</strong>
              </p>

              <p>
                Customers:
                <strong>{{ customerContacts }}</strong>
              </p>
            </div>

          </div>


          <!-- =================================================
               INBOX
          ================================================== -->

          <div
            *ngIf="active === 'Inbox'"
          >

            <div
              style="
                margin-bottom: 16px;
                padding: 10px 14px;
                border-radius: 10px;
                background: #f4f7ff;
                font-size: 14px;
              "
            >

              <strong>
                Live Inbox
              </strong>

              <span
                *ngIf="socketConnected"
                style="margin-left: 10px; color: #166534;"
              >
                ● Live updates enabled
              </span>

              <span
                *ngIf="!socketConnected"
                style="margin-left: 10px; color: #991b1b;"
              >
                ● Connecting...
              </span>

            </div>


            <div
              *ngIf="conversations.length === 0"
              class="empty"
            >
              No conversations yet.
            </div>

            <div
              class="conversation"
              *ngFor="let c of conversations"
              (click)="selectConversation(c)"
              [style.cursor]="'pointer'"
              [style.border]="
                selectedConversation?._id === c._id
                  ? '2px solid #18233f'
                  : '1px solid #e5e7eb'
              "
            >

              <b>

                {{ c.channel | uppercase }}

                ·

                {{ c.status }}

              </b>

              <p
                *ngFor="let m of c.messages"
              >

                {{ m.direction }}:

                {{ m.text }}

              </p>


              <!-- REPLY BOX -->

              <div
                *ngIf="selectedConversation?._id === c._id"
                style="
                  margin-top: 14px;
                  padding-top: 12px;
                  border-top: 1px solid #e5e7eb;
                "
                (click)="$event.stopPropagation()"
              >

                <form
                  (ngSubmit)="sendReply()"
                  style="
                    display: flex;
                    gap: 8px;
                    align-items: center;
                  "
                >

                  <input
                    [(ngModel)]="replyMessage"
                    name="replyMessage"
                    placeholder="Type a reply..."
                    autocomplete="off"
                    [disabled]="sendingReply"
                    style="
                      flex: 1;
                      padding: 11px 13px;
                      border: 1px solid #d1d5db;
                      border-radius: 8px;
                      font-size: 14px;
                    "
                  />

                  <button
                    class="primary"
                    type="submit"
                    [disabled]="
                      sendingReply ||
                      !replyMessage.trim()
                    "
                  >
                    {{ sendingReply ? "Sending..." : "Send Reply" }}
                  </button>

                </form>

              </div>

            </div>


            <!-- REAL-TIME EVENTS -->

            <div
              *ngIf="liveMessages.length > 0"
              style="margin-top: 24px;"
            >

              <h3>
                Recent Live Events
              </h3>

              <div
                *ngFor="let event of liveMessages.slice(0, 5)"
                style="
                  padding: 10px;
                  margin-bottom: 8px;
                  border-radius: 8px;
                  background: #eef6ff;
                "
              >

                <strong>
                  New conversation received
                </strong>

                <div>
                  Channel:
                  {{ event.channel }}
                </div>

                <div>
                  Status:
                  {{ event.status }}
                </div>

              </div>

            </div>

          </div>


          <!-- =================================================
               AUDIT LOGS
          ================================================== -->

          <div *ngIf="active === 'Audit Logs'">

            <div class="card" style="margin-bottom: 16px;">
              <h3>Recent Audit Activity</h3>
              <p>AI, webhook and configuration actions for this workspace.</p>
            </div>

            <div *ngIf="auditLogs.length === 0" class="empty">
              No audit activity yet.
            </div>

            <div class="row" *ngFor="let log of auditLogs">
              <div>
                <b>{{ log.action }}</b>
                <small style="display:block;">{{ log.resource || 'system' }}</small>
              </div>
              <span>{{ log.status }}</span>
              <small>{{ log.createdAt | date:'short' }}</small>
            </div>

          </div>


          <!-- =================================================
               SYSTEM HEALTH
          ================================================== -->

          <div *ngIf="active === 'System Health'">

            <div class="cards">
              <div class="card">
                <b>{{ systemHealth?.services?.api || 'Checking...' }}</b>
                <span>API</span>
              </div>
              <div class="card">
                <b>{{ systemHealth?.services?.mongodb || 'Checking...' }}</b>
                <span>MongoDB</span>
              </div>
              <div class="card">
                <b>{{ systemHealth?.services?.redis || 'Checking...' }}</b>
                <span>Redis</span>
              </div>
              <div class="card">
                <b>{{ systemHealth?.services?.bullmq || 'Checking...' }}</b>
                <span>BullMQ</span>
              </div>
            </div>

            <div class="card" style="margin-top: 20px;">
              <h3>Queue Metrics</h3>
              <p>Waiting: <strong>{{ systemHealth?.queue?.waiting || 0 }}</strong></p>
              <p>Active: <strong>{{ systemHealth?.queue?.active || 0 }}</strong></p>
              <p>Completed: <strong>{{ systemHealth?.queue?.completed || 0 }}</strong></p>
              <p>Failed: <strong>{{ systemHealth?.queue?.failed || 0 }}</strong></p>
              <button class="primary" type="button" (click)="loadSystemHealth()">Refresh Health</button>
            </div>

          </div>


          <!-- =================================================
               AI AGENT
          ================================================== -->

          <div
            *ngIf="active === 'AI Agent'"
            class="agent"
          >

            <h3>
              AI Agent Configuration
            </h3>

            <label>

              Agent Greeting

              <input
                [(ngModel)]="greeting"
              />

            </label>

            <label>

              Guardrails

              <textarea
                [(ngModel)]="guardrails"
              ></textarea>

            </label>


            <h3>
              Available Tools
            </h3>

            <div
              class="tools"
              style="
                display: grid;
                gap: 10px;
                max-width: 520px;
              "
            >

              <label
                *ngFor="let tool of availableTools"
                style="
                  display: flex;
                  align-items: center;
                  gap: 10px;
                  padding: 10px 12px;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  cursor: pointer;
                  background: #fafbff;
                "
              >
                <input
                  type="checkbox"
                  [checked]="selectedTools.includes(tool)"
                  (change)="toggleTool(tool)"
                />

                <span>
                  {{ tool }}
                </span>
              </label>

            </div>

            <div style="margin-top: 18px;">

              <button
                class="primary"
                type="button"
                (click)="saveAgentConfig()"
                [disabled]="savingAgentConfig"
              >
                {{
                  savingAgentConfig
                    ? "Saving..."
                    : "Save Configuration"
                }}
              </button>

              <span
                *ngIf="agentConfigMessage"
                style="
                  margin-left: 12px;
                  color: #166534;
                  font-size: 14px;
                "
              >
                {{ agentConfigMessage }}
              </span>

            </div>


            <!-- =================================================
                 AI ASSISTANT
            ================================================== -->

            <div class="ai-chat">

              <div class="ai-chat-header">

                <div>

                  <h3>
                    🤖 AI Operations Assistant
                  </h3>

                  <small>
                    Local AI agent · MongoDB connected
                  </small>

                </div>

                <span class="status">
                  ● Online
                </span>

              </div>


              <!-- CHAT MESSAGES -->

              <div class="ai-messages">

                <div
                  *ngIf="aiMessages.length === 0"
                  class="empty"
                >

                  <p>
                    Ask the AI agent to perform an operation.
                  </p>

                  <small>
                    Try: "Create a high priority ticket for a payment issue"
                  </small>

                </div>


                <div
                  *ngFor="let msg of aiMessages"
                  class="ai-message"
                  [class.user-message]="msg.role === 'user'"
                  [class.assistant-message]="msg.role === 'assistant'"
                >

                  <b>
                    {{ msg.role === "user" ? "You" : "AI Agent" }}
                  </b>

                  <p>
                    {{ msg.content }}
                  </p>

                  <small
                    *ngIf="msg.tool"
                  >
                    Tool: {{ msg.tool }}
                  </small>

                </div>


                <div
                  *ngIf="aiLoading"
                  class="ai-message assistant-message"
                >

                  <b>
                    AI Agent
                  </b>

                  <p>
                    Processing request...
                  </p>

                </div>

              </div>


              <!-- CHAT INPUT -->

              <form
                class="ai-input"
                (ngSubmit)="sendAiMessage()"
              >

                <input
                  [(ngModel)]="aiMessage"
                  name="aiMessage"
                  placeholder="Ask the AI agent..."
                  [disabled]="aiLoading"
                  autocomplete="off"
                />

                <button
                  class="primary"
                  type="submit"
                  [disabled]="
                    aiLoading ||
                    !aiMessage.trim()
                  "
                >
                  {{ aiLoading ? "..." : "Send" }}
                </button>

              </form>


              <!-- QUICK ACTIONS -->

              <div class="quick-actions">

                <button
                  type="button"
                  (click)="useQuickPrompt(
                    'Create a high priority ticket for a payment issue'
                  )"
                >
                  Create payment ticket
                </button>

                <button
                  type="button"
                  (click)="useQuickPrompt(
                    'Show me Rahul Sharma customer history'
                  )"
                >
                  Customer history
                </button>

                <button
                  type="button"
                  (click)="useQuickPrompt(
                    'Schedule a meeting with the customer'
                  )"
                >
                  Schedule meeting
                </button>

              </div>

            </div>

          </div>

        </section>

      </section>

    </main>
  `
})


class AppComponent {

  private http = inject(HttpClient);


  /*
   * ========================================================
   * AUTHENTICATION
   * ========================================================
   */

  token = localStorage.getItem("token");

  email = "";

  password = "";


  /*
   * ========================================================
   * UI STATE
   * ========================================================
   */

  loading = false;

  error = "";


  /*
   * ========================================================
   * NAVIGATION
   * ========================================================
   */

  nav = [
    "Overview",
    "Inbox",
    "Contacts",
    "Tickets",
    "Analytics",
    "Audit Logs",
    "System Health",
    "AI Agent"
  ];

  active = "Overview";


  /*
   * ========================================================
   * BACKEND DATA
   * ========================================================
   */

  contacts: any[] = [];

  tickets: any[] = [];

  conversations: any[] = [];

  auditLogs: any[] = [];

  systemHealth: any = null;


  /*
   * ========================================================
   * ANALYTICS
   * ========================================================
   */

  get openTickets() {
    return this.tickets.filter(
      ticket => ticket.status === "open"
    ).length;
  }

  get inProgressTickets() {
    return this.tickets.filter(
      ticket => ticket.status === "in_progress"
    ).length;
  }

  get resolvedTickets() {
    return this.tickets.filter(
      ticket => ticket.status === "resolved"
    ).length;
  }

  get webConversations() {
    return this.conversations.filter(
      conversation => conversation.channel === "web"
    ).length;
  }

  get whatsappConversations() {
    return this.conversations.filter(
      conversation => conversation.channel === "whatsapp"
    ).length;
  }

  get leadContacts() {
    return this.contacts.filter(
      contact => contact.status === "lead"
    ).length;
  }

  get prospectContacts() {
    return this.contacts.filter(
      contact => contact.status === "prospect"
    ).length;
  }

  get customerContacts() {
    return this.contacts.filter(
      contact => contact.status === "customer"
    ).length;
  }


  /*
   * ========================================================
   * AI AGENT CONFIGURATION
   * ========================================================
   */

  greeting =
    "Hi! How can I help you today?";

  guardrails =
    "Do not expose private customer data.";

  savingAgentConfig = false;

  agentConfigMessage = "";

  availableTools = [
    "create_ticket",
    "schedule_meeting",
    "update_contact",
    "get_customer_history"
  ];

  selectedTools = [
    "create_ticket",
    "schedule_meeting",
    "update_contact",
    "get_customer_history"
  ];


  /*
   * ========================================================
   * AI CHAT STATE
   * ========================================================
   */

  aiMessage = "";

  aiLoading = false;

  aiSessionId: string | null = null;

  aiMessages: {

    role: "user" | "assistant";
    content: string;
    tool?: string;
  }[] = [];


  /*
   * ========================================================
   * SOCKET.IO REAL-TIME STATE
   * ========================================================
   */

  private socket: Socket | null = null;

  socketConnected = false;

  liveMessages: any[] = [];

  /*
   * ========================================================
   * INBOX REPLY STATE
   * ========================================================
   */

  selectedConversation: any | null = null;

  replyMessage = "";

  sendingReply = false;


  /*
   * ========================================================
   * INITIALIZATION
   * ========================================================
   */

  constructor() {

    if (this.token) {

      this.loadData();

      this.loadAgentConfig();
      this.loadAuditLogs();
      this.loadSystemHealth();

      this.loadAiHistory();

      this.connectSocket();

    }

  }


  /*
   * ========================================================
   * LOGIN
   * ========================================================
   */

  login() {

    this.loading = true;

    this.error = "";

    this.http.post<any>(
      `${API_URL}/auth/login`,
      {
        email: this.email,
        password: this.password
      }
    ).subscribe({

      next: (response) => {

        this.token =
          response.token;

        localStorage.setItem(
          "token",
          response.token
        );

        this.loading = false;

        this.loadData();

        this.loadAgentConfig();
        this.loadAuditLogs();
        this.loadSystemHealth();

        this.loadAiHistory();

        this.connectSocket();

      },

      error: (err) => {

        this.loading = false;

        this.error =
          err.error?.message ||
          "Login failed. Check your email and password.";

      }

    });

  }


  /*
   * ========================================================
   * GET ORGANIZATION ID FROM JWT
   * ========================================================
   */

  getOrganizationIdFromToken(): string | null {

    if (!this.token) {

      return null;

    }

    try {

      const tokenParts =
        this.token.split(".");

      if (tokenParts.length < 2) {

        return null;

      }

      /*
       * JWT uses base64url encoding.
       * Convert it to normal base64.
       */

      let base64 =
        tokenParts[1]
          .replace(/-/g, "+")
          .replace(/_/g, "/");

      while (
        base64.length % 4 !== 0
      ) {

        base64 += "=";

      }

      const payload =
        JSON.parse(
          atob(base64)
        );

      return (
        payload.organizationId ||
        null
      );

    } catch (error) {

      console.error(
        "Could not decode JWT:",
        error
      );

      return null;

    }

  }


  /*
   * ========================================================
   * SOCKET.IO CONNECTION
   * ========================================================
   */

  connectSocket() {

    if (!this.token || this.socket) {
      return;
    }

    console.log(
      "Connecting to Socket.IO..."
    );

    /*
     * Send the JWT during the Socket.IO handshake.
     *
     * The backend verifies this token and determines
     * the organization from the authenticated JWT.
     *
     * The client no longer chooses the organization room.
     */
    this.socket = io(
      SOCKET_URL,
      {
        transports: ["websocket"],
        auth: {
          token: this.token
        }
      }
    );

    /*
     * SOCKET CONNECTED
     */

    this.socket.on(
      "connect",
      () => {

        console.log(
          "Socket.IO connected:",
          this.socket?.id
        );

        this.socketConnected = true;

      }
    );

    /*
     * SOCKET DISCONNECTED
     */

    this.socket.on(
      "disconnect",
      (reason) => {

        console.log(
          "Socket.IO disconnected:",
          reason
        );

        this.socketConnected = false;

      }
    );

    /*
     * CONNECTION ERROR
     */

    this.socket.on(
      "connect_error",
      (error) => {

        console.error(
          "Socket.IO connection error:",
          error.message
        );

        this.socketConnected = false;

      }
    );

    /*
     * NEW CONVERSATION
     */

    this.socket.on(
      "conversation:new",
      (conversation: any) => {

        console.log(
          "Real-time conversation received:",
          conversation
        );

        /*
         * Store live event for UI.
         */

        this.liveMessages.unshift(
          conversation
        );

        /*
         * Keep only latest 20 events.
         */

        this.liveMessages =
          this.liveMessages.slice(
            0,
            20
          );

        /*
         * Refresh MongoDB data.
         */

        this.loadData();

      }
    );

    /*
     * NEW MESSAGE
     */

    this.socket.on(
      "conversation:message",
      (message: any) => {

        console.log(
          "Real-time message received:",
          message
        );

        this.liveMessages.unshift(
          message
        );

        this.liveMessages =
          this.liveMessages.slice(
            0,
            20
          );

        /*
         * Refresh MongoDB data so the Inbox immediately
         * shows the new inbound/outbound message.
         */

        this.loadData();

      }
    );

  }


  /*
   * ========================================================
   * LOAD DASHBOARD DATA
   * ========================================================
   */

  loadAuditLogs() {

    if (!this.token) return;

    this.http.get<any[]>(`${API_URL}/audit-logs`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: logs => this.auditLogs = logs,
      error: err => console.error("Audit log load error:", err)
    });
  }


  loadSystemHealth() {

    this.http.get<any>(`${API_URL}/health`).subscribe({
      next: health => this.systemHealth = health,
      error: err => {
        this.systemHealth = {
          services: {
            api: "unhealthy",
            mongodb: "unknown",
            redis: "unknown",
            bullmq: "unknown"
          },
          queue: {}
        };
        console.error("Health check error:", err);
      }
    });
  }


  loadData() {

    if (!this.token) {

      return;

    }


    const headers = {

      Authorization:
        `Bearer ${this.token}`

    };


    /*
     * CONTACTS
     */

    this.http.get<any[]>(
      `${API_URL}/contacts`,
      {
        headers
      }

    ).subscribe({

      next: (data) => {

        this.contacts =
          data;

      },

      error: (err) => {

        console.error(
          "Contacts error:",
          err
        );

      }

    });


    /*
     * TICKETS
     */

    this.http.get<any[]>(
      `${API_URL}/tickets`,
      {
        headers
      }

    ).subscribe({

      next: (data) => {

        this.tickets =
          data;

      },

      error: (err) => {

        console.error(
          "Tickets error:",
          err
        );

      }

    });


    /*
     * CONVERSATIONS
     */

    this.http.get<any[]>(
      `${API_URL}/conversations`,
      {
        headers
      }

    ).subscribe({

      next: (data) => {

        this.conversations =
          data;

      },

      error: (err) => {

        console.error(
          "Conversations error:",
          err
        );

      }

    });

  }


  /*
   * ========================================================
   * AI AGENT CONFIGURATION
   * ========================================================
   */

  loadAgentConfig() {

    if (!this.token) {
      return;
    }

    const headers = {
      Authorization: `Bearer ${this.token}`
    };

    this.http.get<any>(
      `${API_URL}/agent-config`,
      { headers }
    ).subscribe({

      next: (config) => {

        this.greeting =
          config.greeting ||
          "Hi! How can I help you today?";

        this.guardrails =
          config.guardrails ||
          "Do not expose private customer data.";

        this.selectedTools =
          Array.isArray(config.tools) &&
          config.tools.length > 0
            ? config.tools.filter((tool: string) =>
                this.availableTools.includes(tool)
              )
            : [...this.availableTools];

      },

      error: (err) => {

        console.error(
          "Load agent config error:",
          err
        );

      }

    });

  }


  toggleTool(tool: string) {

    if (this.selectedTools.includes(tool)) {

      this.selectedTools =
        this.selectedTools.filter(
          selected => selected !== tool
        );

    } else {

      this.selectedTools = [
        ...this.selectedTools,
        tool
      ];

    }

  }


  saveAgentConfig() {

    if (!this.token || this.savingAgentConfig) {
      return;
    }

    this.savingAgentConfig = true;
    this.agentConfigMessage = "";

    const headers = {
      Authorization: `Bearer ${this.token}`
    };

    this.http.post<any>(
      `${API_URL}/agent-config`,
      {
        greeting: this.greeting,
        guardrails: this.guardrails,
        tools: this.selectedTools
      },
      { headers }
    ).subscribe({

      next: () => {

        this.savingAgentConfig = false;
        this.agentConfigMessage =
          "Configuration saved successfully.";

        setTimeout(() => {
          this.agentConfigMessage = "";
        }, 3000);

      },

      error: (err) => {

        console.error(
          "Save agent config error:",
          err
        );

        this.savingAgentConfig = false;
        this.agentConfigMessage =
          err.error?.message ||
          "Failed to save configuration.";

      }

    });

  }


  /*
   * ========================================================
   * INBOX REPLIES
   * ========================================================
   */

  selectConversation(conversation: any) {

    this.selectedConversation =
      conversation;

    this.replyMessage = "";

  }


  sendReply() {

    if (
      !this.token ||
      !this.selectedConversation?._id ||
      !this.replyMessage.trim() ||
      this.sendingReply
    ) {

      return;

    }

    const conversationId =
      String(this.selectedConversation._id);

    const text =
      this.replyMessage.trim();

    this.sendingReply = true;

    const headers = {
      Authorization:
        `Bearer ${this.token}`
    };

    this.http.post<any>(
      `${API_URL}/conversations/${conversationId}/messages`,
      {
        text
      },
      {
        headers
      }
    ).subscribe({

      next: () => {

        this.replyMessage = "";

        this.sendingReply = false;

        /*
         * The backend emits conversation:message
         * through Socket.IO. The socket listener
         * below will receive the event and refresh
         * the inbox automatically.
         */

        this.loadData();

      },

      error: (err) => {

        console.error(
          "Send reply error:",
          err
        );

        this.sendingReply = false;

        this.aiMessages.push({
          role: "assistant",
          content:
            err.error?.message ||
            "Could not send the reply."
        });

      }

    });

  }


  /*
   * ========================================================
   * AI CHAT HISTORY
   * ========================================================
   */

  loadAiHistory() {

    if (!this.token) {
      return;
    }

    const headers = {
      Authorization: `Bearer ${this.token}`
    };

    this.http.get<any>(
      `${API_URL}/ai/history`,
      { headers }
    ).subscribe({

      next: (response) => {

        this.aiSessionId =
          response.sessionId || null;

        this.aiMessages =
          (response.history || []).map(
            (message: any) => ({
              role: message.role,
              content: message.content,
              tool: message.tool
            })
          );

      },

      error: (err) => {
        console.error(
          "AI history error:",
          err
        );
      }

    });

  }


  /*
   * ========================================================
   * AI CHAT
   * ========================================================
   */

  sendAiMessage() {

    if (
      !this.token ||
      !this.aiMessage.trim() ||
      this.aiLoading
    ) {

      return;

    }


    const message =
      this.aiMessage.trim();


    /*
     * Add user message.
     */

    this.aiMessages.push({

      role: "user",

      content:
        message

    });


    /*
     * Clear input.
     */

    this.aiMessage = "";

    this.aiLoading = true;


    /*
     * JWT headers.
     */

    const headers = {

      Authorization:
        `Bearer ${this.token}`

    };


    /*
     * Call backend AI agent.
     */

    this.http.post<any>(
      `${API_URL}/ai/chat`,
      {
        message,
        sessionId: this.aiSessionId
      },
      {
        headers
      }

    ).subscribe({

      next: (response) => {

        this.aiSessionId =
          response.sessionId ||
          this.aiSessionId;

        this.aiMessages.push({

          role: "assistant",

          content:
            response.message ||
            "The operation completed successfully.",

          tool:
            response.tool

        });


        /*
         * Refresh dashboard data.
         *
         * Example:
         *
         * AI creates ticket
         *        ↓
         * MongoDB
         *        ↓
         * Ticket count updates
         */

        this.loadData();

        this.aiLoading =
          false;

      },

      error: (err) => {

        console.error(
          "AI chat error:",
          err
        );


        this.aiMessages.push({

          role: "assistant",

          content:
            err.error?.message ||
            "The AI agent could not process your request."

        });


        this.aiLoading =
          false;

      }

    });

  }


  /*
   * ========================================================
   * QUICK PROMPTS
   * ========================================================
   */

  useQuickPrompt(
    prompt: string
  ) {

    this.aiMessage =
      prompt;

  }


  /*
   * ========================================================
   * LOGOUT
   * ========================================================
   */

  logout() {

    /*
     * Disconnect Socket.IO.
     */

    if (this.socket) {

      this.socket.disconnect();

      this.socket = null;

    }


    /*
     * Remove JWT.
     */

    localStorage.removeItem(
      "token"
    );


    /*
     * Reset application.
     */

    this.token =
      null;

    this.contacts =
      [];

    this.tickets =
      [];

    this.conversations =
      [];

    this.aiMessages =
      [];

    this.aiSessionId =
      null;

    this.liveMessages =
      [];

    this.socketConnected =
      false;

  }

}


/*
 * ==========================================================
 * BOOTSTRAP ANGULAR APPLICATION
 * ==========================================================
 */

bootstrapApplication(
  AppComponent,
  {
    providers: [
      provideHttpClient()
    ]
  }
).catch(
  console.error
);