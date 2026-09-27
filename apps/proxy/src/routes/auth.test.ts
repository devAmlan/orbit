import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../app.js";
import { db } from "../services/db.js";

let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db.exec("DELETE FROM users");
  // fresh app per test: the login/signup rate limiter's store is created inside
  // createApp(), so reusing one app across tests would trip 429s on later tests
  app = createApp();
});

const credentials = { name: "Ada Lovelace", email: "ada@example.com", password: "hunter2222" };

describe("POST /auth/signup", () => {
  it("creates a user, sets an httpOnly session cookie, and never returns the password hash", async () => {
    const res = await request(app).post("/auth/signup").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.user).toEqual({ id: expect.any(String), email: credentials.email, name: credentials.name });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|hunter2222/);

    const cookie = res.headers["set-cookie"]?.[0];
    expect(cookie).toMatch(/^orbit_session=/);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/SameSite=Lax/i);
  });

  it("rejects a duplicate email with 409 EMAIL_TAKEN", async () => {
    await request(app).post("/auth/signup").send(credentials);
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...credentials, name: "Someone Else" });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe("EMAIL_TAKEN");
  });

  it("rejects a password under 8 characters with 400 INVALID_BODY", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...credentials, password: "short" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_BODY");
  });

  it("rejects a malformed email with 400 INVALID_BODY", async () => {
    const res = await request(app)
      .post("/auth/signup")
      .send({ ...credentials, email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe("INVALID_BODY");
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/signup").send(credentials);
  });

  it("logs in with correct credentials and sets a session cookie", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.headers["set-cookie"]?.[0]).toMatch(/^orbit_session=/);
  });

  it("rejects a wrong password and an unknown email identically with 401", async () => {
    const wrongPassword = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: "totally-wrong" });
    const unknownEmail = await request(app)
      .post("/auth/login")
      .send({ email: "nobody@example.com", password: credentials.password });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual({ code: "INVALID_CREDENTIALS", message: expect.any(String) });
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  it("sets a 30-day cookie when remember is true, vs a 1-day cookie by default", async () => {
    const remembered = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: credentials.password, remember: true });
    const notRemembered = await request(app)
      .post("/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    const maxAgeOf = (setCookie: string) => Number(/Max-Age=(\d+)/i.exec(setCookie)?.[1]);
    expect(maxAgeOf(remembered.headers["set-cookie"][0])).toBeGreaterThan(
      maxAgeOf(notRemembered.headers["set-cookie"][0]),
    );
  });
});

describe("session lifecycle", () => {
  it("keeps a session working across requests via GET /auth/me, then clears it on logout", async () => {
    const agent = request.agent(app);

    await agent.post("/auth/signup").send(credentials).expect(201);

    const me = await agent.get("/auth/me");
    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe(credentials.email);

    await agent.post("/auth/logout").expect(204);

    const meAfterLogout = await agent.get("/auth/me");
    expect(meAfterLogout.status).toBe(401);
    expect(meAfterLogout.body.code).toBe("AUTH_REQUIRED");
  });

  it("rejects GET /auth/me with no cookie", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects GET /auth/me with a tampered cookie", async () => {
    const res = await request(app).get("/auth/me").set("Cookie", "orbit_session=not-a-real-jwt");
    expect(res.status).toBe(401);
  });
});
