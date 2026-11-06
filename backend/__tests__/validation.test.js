import { afterAll, beforeAll, describe, expect, it } from "vitest";

// An invalid URI makes Mongo fail fast, so the API uses the local fallback store.
process.env.MONGODB_URI = "invalid-uri-for-tests";
const { default: app } = await import("../src/app.js");

let server;
let baseUrl;
let token;

async function call(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

beforeAll(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  const { data } = await call("/api/auth/register", {
    method: "POST",
    auth: false,
    body: { name: "Profile Tester", email: `profile-${Date.now()}@test.dev`, password: "longpassword1" },
  });
  token = data.token;
});

afterAll(() => server.close());

describe("Profile update validation", () => {
  it("requires a login", async () => {
    const res = await call("/api/user/profile", { method: "PUT", auth: false, body: { name: "X" } });
    expect(res.status).toBe(401);
  });

  it("saves valid fields and ignores unknown ones", async () => {
    const res = await call("/api/user/profile", {
      method: "PUT",
      body: { name: "  New Name  ", gradYear: "2027", isAdmin: true, platformHandles: { leetcode: "my_handle" } },
    });
    expect(res.status).toBe(200);
    expect(res.data.user.name).toBe("New Name");
    expect(res.data.user.platformHandles.leetcode).toBe("my_handle");
    expect(res.data.user.isAdmin).toBe(undefined);
    expect(res.data.user.password).toBe(undefined);
  });

  it("rejects bad email, year, handle, image and oversized lists", async () => {
    const bad = [
      { email: "not-an-email" },
      { gradYear: "20x7" },
      { name: "x".repeat(81) },
      { platformHandles: { github: "bad handle!" } },
      { profileImage: "data:image/gif;base64,AAAA" },
      { skills: Array.from({ length: 31 }, (_, i) => `skill-${i}`) },
    ];
    for (const body of bad) {
      const res = await call("/api/user/profile", { method: "PUT", body });
      expect(res.status).toBe(400);
    }
  });
});

describe("Growth log validation", () => {
  it("accepts a normal log and rejects out-of-range input", async () => {
    const ok = await call("/api/growth/log", { method: "POST", body: { platform: "LeetCode", problemsSolved: 3 } });
    expect(ok.status).toBe(201);

    const tooMany = await call("/api/growth/log", { method: "POST", body: { platform: "LeetCode", problemsSolved: 500 } });
    expect(tooMany.status).toBe(400);

    const badPlatform = await call("/api/growth/log", { method: "POST", body: { platform: "MySpace", problemsSolved: 1 } });
    expect(badPlatform.status).toBe(400);
  });
});

describe("Platform handle validation", () => {
  it("rejects a malformed handle before calling the provider", async () => {
    const res = await call(`/api/platforms/leetcode/${encodeURIComponent("bad handle<script>")}`, { auth: false });
    expect(res.status).toBe(400);
  });
});
