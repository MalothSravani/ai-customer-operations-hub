import mongoose from "mongoose";
import { config } from "./config";
import {
  User,
  Contact,
  Ticket,
  Conversation
} from "./models";

async function seed() {
  try {
    console.log("Connecting to MongoDB...");

    await mongoose.connect(config.mongoUri);

    console.log("MongoDB connected.");

    // --------------------------------------------------
    // 1. Get the logged-in user's organization
    // --------------------------------------------------

    const email = process.argv[2];

    if (!email) {
      console.log("");
      console.log("ERROR: Please provide your login email.");
      console.log("");
      console.log("Example:");
      console.log('npx tsx src/seed.ts "your-email@example.com"');
      console.log("");
      process.exit(1);
    }

    const user = await User.findOne({
      email: email.toLowerCase()
    });

    if (!user) {
      console.log("");
      console.log("ERROR: User not found.");
      console.log("Check that you entered the same email used to log in.");
      console.log("");
      process.exit(1);
    }

    const organizationId = user.organizationId;

    console.log("User:", user.name);
    console.log("Organization ID:", organizationId.toString());

    // --------------------------------------------------
    // 2. Create Contacts
    // --------------------------------------------------

    const contactData = [
      {
        name: "Rahul Sharma",
        phone: "+91 9876543210",
        email: "demo.rahul@example.com",
        status: "lead"
      },
      {
        name: "Priya Reddy",
        phone: "+91 9876543211",
        email: "demo.priya@example.com",
        status: "customer"
      },
      {
        name: "Arjun Kumar",
        phone: "+91 9876543212",
        email: "demo.arjun@example.com",
        status: "lead"
      },
      {
        name: "Sneha Patel",
        phone: "+91 9876543213",
        email: "demo.sneha@example.com",
        status: "customer"
      },
      {
        name: "Vikram Singh",
        phone: "+91 9876543214",
        email: "demo.vikram@example.com",
        status: "prospect"
      }
    ];

    const contacts = [];

    for (const data of contactData) {
      let contact = await Contact.findOne({
        organizationId,
        email: data.email
      });

      if (!contact) {
        contact = await Contact.create({
          organizationId,
          ...data
        });

        console.log("Created contact:", data.name);
      } else {
        console.log("Contact already exists:", data.name);
      }

      contacts.push(contact);
    }

    // --------------------------------------------------
    // 3. Create Tickets
    // --------------------------------------------------

    const ticketData = [
      {
        title: "Unable to complete payment",
        priority: "high",
        status: "open",
        contactIndex: 0
      },
      {
        title: "Request for account upgrade",
        priority: "medium",
        status: "in_progress",
        contactIndex: 1
      },
      {
        title: "Password reset assistance",
        priority: "low",
        status: "resolved",
        contactIndex: 2
      },
      {
        title: "Invoice not received",
        priority: "medium",
        status: "open",
        contactIndex: 3
      },
      {
        title: "Product information request",
        priority: "low",
        status: "open",
        contactIndex: 4
      }
    ];

    for (const data of ticketData) {
      const existingTicket = await Ticket.findOne({
        organizationId,
        title: data.title
      });

      if (!existingTicket) {
        await Ticket.create({
          organizationId,
          contactId: contacts[data.contactIndex]._id,
          title: data.title,
          priority: data.priority,
          status: data.status
        });

        console.log("Created ticket:", data.title);
      } else {
        console.log("Ticket already exists:", data.title);
      }
    }

    // --------------------------------------------------
    // 4. Create Conversations
    // --------------------------------------------------

    const conversationData = [
      {
        contactIndex: 0,
        channel: "whatsapp",
        status: "open",
        messages: [
          {
            direction: "inbound",
            text: "Hi, my payment is failing."
          },
          {
            direction: "outbound",
            text: "Hello Rahul. I will check the payment issue for you."
          }
        ]
      },
      {
        contactIndex: 1,
        channel: "web",
        status: "open",
        messages: [
          {
            direction: "inbound",
            text: "I would like to upgrade my account."
          },
          {
            direction: "outbound",
            text: "Sure. I can help you with the upgrade process."
          }
        ]
      },
      {
        contactIndex: 2,
        channel: "web",
        status: "closed",
        messages: [
          {
            direction: "inbound",
            text: "I forgot my password."
          },
          {
            direction: "outbound",
            text: "Your password reset instructions have been sent."
          }
        ]
      },
      {
        contactIndex: 3,
        channel: "whatsapp",
        status: "open",
        messages: [
          {
            direction: "inbound",
            text: "I haven't received my invoice."
          },
          {
            direction: "outbound",
            text: "I will check your invoice and get back to you."
          }
        ]
      },
      {
        contactIndex: 4,
        channel: "web",
        status: "open",
        messages: [
          {
            direction: "inbound",
            text: "Can you tell me more about your product?"
          },
          {
            direction: "outbound",
            text: "Absolutely. I can provide the product details."
          }
        ]
      }
    ];

    for (const data of conversationData) {
      const contact = contacts[data.contactIndex];

      const existingConversation = await Conversation.findOne({
        organizationId,
        contactId: contact._id,
        channel: data.channel
      });

      if (!existingConversation) {
        await Conversation.create({
          organizationId,
          contactId: contact._id,
          channel: data.channel,
          status: data.status,
          messages: data.messages,
          updatedAt: new Date()
        });

        console.log(
          "Created conversation for:",
          contact.name
        );
      } else {
        console.log(
          "Conversation already exists for:",
          contact.name
        );
      }
    }

    // --------------------------------------------------
    // 5. Show final counts
    // --------------------------------------------------

    const contactCount = await Contact.countDocuments({
      organizationId
    });

    const ticketCount = await Ticket.countDocuments({
      organizationId
    });

    const conversationCount = await Conversation.countDocuments({
      organizationId
    });

    console.log("");
    console.log("--------------------------------");
    console.log("SEED COMPLETED");
    console.log("--------------------------------");
    console.log("Contacts:", contactCount);
    console.log("Tickets:", ticketCount);
    console.log("Conversations:", conversationCount);
    console.log("--------------------------------");
    console.log("");

    await mongoose.disconnect();

    process.exit(0);

  } catch (error) {
    console.error("");
    console.error("SEED ERROR:");
    console.error(error);
    console.error("");

    await mongoose.disconnect();

    process.exit(1);
  }
}

seed();