import swaggerJsdoc from "swagger-jsdoc";
import swaggerUiDist from "swagger-ui-dist";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const toGlobSafePath = (inputPath) => inputPath.replace(/\\/g, "/");

const appSourcePath = toGlobSafePath(path.resolve(__dirname, "../app.js"));
const routesSourceGlob = toGlobSafePath(
  path.resolve(__dirname, "../routes/*.js"),
);

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "ILMA API",
    version: "1.0.0",
    description: "API documentation for the ILMA backend.",
  },
  servers: [{ url: "/api", description: "Local API base path" }],
  tags: [
    { name: "Health", description: "Service liveness checks" },
    { name: "Auth", description: "User authentication" },
    { name: "Admin Auth", description: "Admin authentication" },
    { name: "Roadmaps", description: "Roadmap templates and user roadmaps" },
    { name: "Courses", description: "Course enrollment and progress" },
    { name: "Admin", description: "Admin management endpoints" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      ObjectId: {
        type: "string",
        pattern: "^[0-9a-fA-F]{24}$",
        example: "507f1f77bcf86cd799439011",
      },
      ValidationErrorItem: {
        type: "object",
        properties: {
          field: { type: "string", example: "body.email" },
          message: { type: "string", example: "Please enter a valid email address." },
        },
      },
      ValidationErrorResponse: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          message: { type: "string", example: "Validation failed." },
          errors: {
            type: "array",
            items: { $ref: "#/components/schemas/ValidationErrorItem" },
          },
        },
      },
      AuthSignupRequest: {
        type: "object",
        required: ["username", "Fname", "Lname", "email", "password"],
        properties: {
          username: { type: "string", minLength: 3, maxLength: 20 },
          Fname: { type: "string", minLength: 2, maxLength: 20 },
          Lname: { type: "string", minLength: 2, maxLength: 20 },
          email: { type: "string", format: "email" },
          password: {
            type: "string",
            minLength: 8,
            pattern:
              "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};':\"\\\\|,.<>/?]).{8,}$",
          },
        },
      },
      AuthVerifyEmailRequest: {
        type: "object",
        required: ["code"],
        properties: {
          code: {
            type: "string",
            pattern: "^[A-Za-z0-9]{8}$",
            example: "A1B2C3D4",
          },
        },
      },
      AuthLoginRequest: {
        type: "object",
        required: ["password"],
        properties: {
          identifier: { type: "string", description: "Email or username" },
          email: { type: "string", format: "email" },
          username: { type: "string" },
          password: { type: "string", minLength: 1 },
        },
      },
      ForgotPasswordRequest: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email" },
        },
      },
      ResetPasswordRequest: {
        type: "object",
        required: ["password"],
        properties: {
          password: {
            type: "string",
            minLength: 8,
            pattern:
              "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=[\\]{};':\"\\\\|,.<>/?]).{8,}$",
          },
        },
      },
      EnrollCourseRequest: {
        type: "object",
        required: ["courseId"],
        properties: {
          courseId: { $ref: "#/components/schemas/ObjectId" },
          roadmapId: { $ref: "#/components/schemas/ObjectId" },
        },
      },
      UpdateCourseProgressRequest: {
        type: "object",
        required: ["lessonId"],
        properties: {
          lessonId: { type: "string", minLength: 1 },
          watchedMinutes: { type: "number", minimum: 0 },
          isComplete: { type: "boolean" },
          notes: { type: "string", maxLength: 2000 },
        },
      },
      RateCourseRequest: {
        type: "object",
        required: ["rating"],
        properties: {
          rating: { type: "number", minimum: 1, maximum: 5 },
          notes: { type: "string", maxLength: 2000 },
        },
      },
      AssignRoadmapRequest: {
        type: "object",
        required: ["templateId"],
        properties: {
          templateId: { $ref: "#/components/schemas/ObjectId" },
          targetDate: { type: "string", format: "date-time" },
          notes: { type: "string", maxLength: 2000 },
        },
      },
      UpdateRoadmapStepProgressRequest: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["notStarted", "inProgress", "completed", "skipped"],
          },
          score: { type: "number", minimum: 0, maximum: 100 },
          timeSpentMinutes: { type: "number", minimum: 0 },
          attempts: { type: "number", minimum: 0 },
          notes: { type: "string", maxLength: 2000 },
        },
      },
      RoadmapResourceInput: {
        type: "object",
        properties: {
          title: { type: "string", maxLength: 120 },
          url: { type: "string", format: "uri" },
        },
      },
      RoadmapStepInput: {
        type: "object",
        required: ["stepKey", "title", "order"],
        properties: {
          stepKey: { type: "string", minLength: 1, maxLength: 50 },
          title: { type: "string", minLength: 3, maxLength: 120 },
          description: { type: "string", maxLength: 1000 },
          course: { $ref: "#/components/schemas/ObjectId" },
          resources: {
            type: "array",
            items: { $ref: "#/components/schemas/RoadmapResourceInput" },
          },
          order: { type: "number", minimum: 0 },
          estimatedMinutes: { type: "number", minimum: 0 },
          required: { type: "boolean" },
          dependsOn: { type: "array", items: { type: "string" } },
        },
      },
      CreateRoadmapTemplateRequest: {
        type: "object",
        required: ["title", "slug", "goal"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 150 },
          slug: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            pattern: "^[a-z0-9-]+$",
          },
          goal: { type: "string", minLength: 10, maxLength: 300 },
          description: { type: "string", maxLength: 2000 },
          targetRole: {
            type: "string",
            enum: ["student", "instructor", "admin", "jobSeeker", "careerSwitcher"],
          },
          targetLevel: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
          tags: { type: "array", items: { type: "string" } },
          steps: {
            type: "array",
            minItems: 1,
            items: { $ref: "#/components/schemas/RoadmapStepInput" },
          },
          estimatedTotalMinutes: { type: "number", minimum: 0 },
          source: { type: "string", enum: ["admin", "ai", "manual"] },
          contentFormat: { type: "string", enum: ["json", "markdown"] },
          contentMarkdown: { type: "string", maxLength: 50000 },
        },
      },
      UpdateRoadmapTemplateRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 150 },
          slug: {
            type: "string",
            minLength: 3,
            maxLength: 100,
            pattern: "^[a-z0-9-]+$",
          },
          goal: { type: "string", minLength: 10, maxLength: 300 },
          description: { type: "string", maxLength: 2000 },
          targetRole: {
            type: "string",
            enum: ["student", "instructor", "admin", "jobSeeker", "careerSwitcher"],
          },
          targetLevel: {
            type: "string",
            enum: ["beginner", "intermediate", "advanced"],
          },
          tags: { type: "array", items: { type: "string" } },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/RoadmapStepInput" },
          },
          estimatedTotalMinutes: { type: "number", minimum: 0 },
          isActive: { type: "boolean" },
          contentFormat: { type: "string", enum: ["json", "markdown"] },
          contentMarkdown: { type: "string", maxLength: 50000 },
        },
      },
      AdminUpdateUserRequest: {
        type: "object",
        properties: {
          role: { type: "string", enum: ["student", "instructor", "admin"] },
          isVerified: { type: "boolean" },
          isActive: { type: "boolean" },
          deactivationReason: { type: "string", maxLength: 500 },
        },
      },
      AdminCreateCourseRequest: {
        type: "object",
        required: ["title", "slug", "description"],
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          slug: {
            type: "string",
            minLength: 3,
            maxLength: 150,
            pattern: "^[a-z0-9-]+$",
          },
          description: { type: "string", minLength: 10, maxLength: 5000 },
          shortDescription: { type: "string", maxLength: 300 },
          level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          language: { type: "string", maxLength: 10 },
          tags: { type: "array", items: { type: "string" } },
          category: { type: "string", maxLength: 120 },
          instructor: { $ref: "#/components/schemas/ObjectId" },
          thumbnailUrl: { type: "string", format: "uri" },
          bannerUrl: { type: "string", format: "uri" },
          durationMinutes: { type: "number", minimum: 0 },
          sections: { type: "array", items: {} },
          prerequisites: { type: "array", items: { type: "string" } },
          learningOutcomes: { type: "array", items: { type: "string" } },
          isPublished: { type: "boolean" },
          isFeatured: { type: "boolean" },
          roadmapTemplate: { $ref: "#/components/schemas/ObjectId" },
        },
      },
      AdminUpdateCourseRequest: {
        type: "object",
        properties: {
          title: { type: "string", minLength: 3, maxLength: 200 },
          slug: {
            type: "string",
            minLength: 3,
            maxLength: 150,
            pattern: "^[a-z0-9-]+$",
          },
          description: { type: "string", minLength: 10, maxLength: 5000 },
          shortDescription: { type: "string", maxLength: 300 },
          level: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
          category: { type: "string", maxLength: 120 },
          isPublished: { type: "boolean" },
          isFeatured: { type: "boolean" },
          instructor: { $ref: "#/components/schemas/ObjectId" },
          roadmapTemplate: { $ref: "#/components/schemas/ObjectId" },
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed.",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ValidationErrorResponse" },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [appSourcePath, routesSourceGlob],
});

export const swaggerUiAssetPath = swaggerUiDist.getAbsoluteFSPath();

export const swaggerInitializerJs = `
window.onload = function() {
  window.ui = SwaggerUIBundle({
    url: '/api/docs/swagger.json',
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    layout: 'StandaloneLayout'
  });
};
`;

export const swaggerHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>ILMA API Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />
    <style>
      html {
        box-sizing: border-box;
        overflow-y: scroll;
      }
      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        background: #fafafa;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script src="/api/docs/swagger-initializer.js"></script>
  </body>
</html>
`;
