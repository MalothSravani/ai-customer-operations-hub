import { Queue, Worker } from "bullmq";
import { config } from "./config";


/*
 * =========================================================
 * REDIS CONNECTION
 * =========================================================
 */

const connection = {
  host: config.redis.host,
  port: config.redis.port
};


/*
 * =========================================================
 * MESSAGE QUEUE
 * =========================================================
 *
 * This is the single exported queue used by:
 *
 * ai.ts
 * routes.ts
 * other background services
 *
 * IMPORTANT:
 * Do NOT import messageQueue from this file itself.
 */

export const messageQueue =
  new Queue(
    "message-processing",
    {
      connection,

      defaultJobOptions: {

        attempts: 3,

        backoff: {
          type: "exponential",
          delay: 1000
        },

        removeOnComplete: 100,

        removeOnFail: 100

      }

    }
  );


/*
 * =========================================================
 * WORKER
 * =========================================================
 */

export const worker =
  new Worker(

    "message-processing",

    async (job) => {

      console.log(
        `Processing job: ${job.name}`,
        job.data
      );


      /*
       * -----------------------------------------------------
       * CONVERSATION CREATED
       * -----------------------------------------------------
       */

      switch (job.name) {

        case "conversation-created": {

          console.log(
            "Conversation processing completed:",
            job.data.conversationId
          );


          return {

            ok: true,

            type:
              "conversation-created"

          };

        }


        /*
         * ---------------------------------------------------
         * WHATSAPP INBOUND
         * ---------------------------------------------------
         */

        case "whatsapp-inbound": {

          console.log(
            "WhatsApp inbound message queued:",
            job.data.payload
          );


          return {

            ok: true,

            type:
              "whatsapp-inbound"

          };

        }


        /*
         * ---------------------------------------------------
         * SCHEDULE MEETING
         * ---------------------------------------------------
         */

        case "schedule-meeting": {

          console.log(
            "Meeting scheduling job received:",
            job.data
          );


          return {

            ok: true,

            type:
              "schedule-meeting",

            status:
              "pending_calendar_integration"

          };

        }


        /*
         * ---------------------------------------------------
         * UNKNOWN JOB
         * ---------------------------------------------------
         */

        default:

          throw new Error(
            `Unknown job type: ${job.name}`
          );

      }

    },

    {
      connection,

      concurrency: 5

    }

  );


/*
 * =========================================================
 * WORKER EVENTS
 * =========================================================
 */

worker.on(
  "completed",
  (job) => {

    console.log(
      `Job completed: ${job.name} (${job.id})`
    );

  }
);


worker.on(
  "failed",
  (job, error) => {

    console.error(
      `Job failed: ${job?.name} (${job?.id})`,
      error.message
    );

  }
);