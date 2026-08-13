import swaggerJsdoc from "swagger-jsdoc";

import { env } from "./env";

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",

    info: {
      title: "NovaDesk AI API",
      version: "1.0.0",
      description: "AI-powered Project Management Backend",
    },

    servers: [
      {
        url: env.PUBLIC_API_URL,
        description: "Local Development",
      },
    ],

    tags: [
      {
        name: "Authentication",
        description: "User authentication APIs",
      },
      {
        name: "Workspace",
        description: "Workspace management",
      },
      {
        name: "Membership",
        description: "Workspace members",
      },
      {
        name: "Project",
        description: "Project management",
      },
      {
        name: "Task",
        description: "Task management",
      },
      {
        name: "Comment",
        description: "Task comments",
      },
      {
        name: "Attachment",
        description: "Task attachments",
      },
      {
        name: "Dashboard",
        description: "Dashboard statistics",
      },
      {
        name: "Health",
        description: "Health check APIs",
      },
      {
        name: "Admin",
        description: "Admin APIs",
      },
    ],

    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },

    security: [
      {
        BearerAuth: [],
      },
    ],
  },

  apis: ["src/routes/*.ts"],
});
