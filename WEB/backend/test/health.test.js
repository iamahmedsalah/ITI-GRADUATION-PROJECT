import assert from "node:assert/strict";
import { after, before, test } from "node:test";

process.env.NODE_ENV = "test";
delete process.env.DB_URL;
delete process.env.DB_URL_FALLBACK;

const { default: app } = await import("../app.js");

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
