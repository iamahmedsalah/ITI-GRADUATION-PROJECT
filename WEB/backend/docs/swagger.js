import swaggerJsdoc from "swagger-jsdoc";
import swaggerUiDist from "swagger-ui-dist";

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
  },
};

export const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ["./backend/app.js", "./backend/routes/**/*.js"],
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
