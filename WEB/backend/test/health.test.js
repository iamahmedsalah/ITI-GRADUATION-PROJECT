import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
process.env.CONTACT_RATE_LIMIT = "100";
delete process.env.DB_URL;
delete process.env.DB_URL_FALLBACK;

const { default: app } = await import("../app.js");
const { transporter } = await import("../config/mailer.js");

let server;

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("GET /api/health stays available without MongoDB", async () => {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/health`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.service, "backend-api");
});

test("GET / returns the status payload", async () => {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.message, "backend is running");
  assert.equal(body.health, "/api/health");
});

test("GET /api/docs redirects to the Swagger UI", async () => {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/docs`, {
    redirect: "manual",
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get("location"), "/api/docs/index.html");
});

test("GET /api/docs/swagger.json includes public API documentation", async () => {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/docs/swagger.json`);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.openapi, "3.0.3");
  assert.ok(body.paths["/contact"]);
});

test("POST /api/contact validates the contact form payload without MongoDB", async () => {
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "A",
      email: "not-an-email",
      message: "short",
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.success, false);
  assert.equal(body.message, "Validation failed.");
  assert.ok(Array.isArray(body.errors));
});

test("POST /api/contact sends a templated email without MongoDB", { skip: !transporter }, async (t) => {
  const sendMail = t.mock.method(transporter, "sendMail", async (payload) => ({
    messageId: "test-contact-message",
    envelope: {
      from: payload.from,
      to: [payload.to],
    },
  }));

  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Contact Tester",
      email: "contact-tester@example.com",
      message:
        'Hello team, <script>alert("x")</script> please help me choose a roadmap.',
    }),
  });
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.success, true);
  assert.equal(body.message, "Message sent successfully.");
  assert.equal(sendMail.mock.callCount(), 1);

  const payload = sendMail.mock.calls[0].arguments[0];
  assert.equal(payload.replyTo.address, "contact-tester@example.com");
  assert.match(payload.html, /New contact message/);
  assert.match(payload.html, /Contact Tester/);
  assert.match(
    payload.html,
    /Hello team, &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; please help me choose a roadmap\./
  );
  assert.doesNotMatch(payload.html, /<script>alert/);
});
