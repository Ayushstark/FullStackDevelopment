import { afterAll, beforeAll, describe, expect, it } from "vitest";

// An invalid URI makes Mongo fail fast, so the API uses the local fallback store.
process.env.MONGODB_URI = "invalid-uri-for-tests";
const { default: app } = await import("../src/app.js");

let server;
let baseUrl;

async function call(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function registerUser(label) {
  const { data } = await call("/api/auth/register", {
    method: "POST",
    body: { name: `Test ${label}`, email: `${label}-${Date.now()}@test.dev`, password: "longpassword1" },
  });
  return data;
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(() => server.close());

describe("Applications API", () => {
  it("rejects requests without a login", async () => {
    expect((await call("/api/applications")).status).toBe(401);
    const created = await call("/api/applications", { method: "POST", body: { role: "SWE", company: "Acme" } });
    expect(created.status).toBe(401);
  });

  it("validates the status and ignores a client-supplied userId", async () => {
    const me = await registerUser("owner");
    const bad = await call("/api/applications", {
      method: "POST",
      token: me.token,
      body: { role: "SWE", company: "Acme", status: "Hacked" },
    });
    expect(bad.status).toBe(400);

    const good = await call("/api/applications", {
      method: "POST",
      token: me.token,
      body: { role: "SWE", company: "Acme", status: "Applied", userId: "someone-else" },
    });
    expect(good.status).toBe(201);
    expect(good.data.application.userId).toBe(me.user._id);
  });

  it("does not let one user change another user's application", async () => {
    const owner = await registerUser("a");
    const other = await registerUser("b");
    const { data } = await call("/api/applications", {
      method: "POST",
      token: owner.token,
      body: { role: "Intern", company: "Beta" },
    });

    const attempt = await call(`/api/applications/${data.application._id}`, {
      method: "PATCH",
      token: other.token,
      body: { status: "Offer" },
    });
    expect(attempt.status).toBe(404);

    const list = await call("/api/applications", { token: other.token });
    expect(list.data.applications.every((a) => a.userId === other.user._id)).toBe(true);
  });
});

describe("Registration input", () => {
  it("rejects an invalid email and a short password", async () => {
    const badEmail = await call("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: "not-an-email", password: "longpassword1" },
    });
    expect(badEmail.status).toBe(400);

    const shortPassword = await call("/api/auth/register", {
      method: "POST",
      body: { name: "Test", email: `short-${Date.now()}@test.dev`, password: "abc" },
    });
    expect(shortPassword.status).toBe(400);
  });
});
