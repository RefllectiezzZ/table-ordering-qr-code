import { describe, expect, it } from "vitest";
import {
  publicOrderSessionEnded,
  resolvePublicOrderRouting,
} from "@/lib/public-order-routing";

describe("resolvePublicOrderRouting", () => {
  it("sessions ON + confirmation ON => missing token creates pending_confirmation", () => {
    expect(
      resolvePublicOrderRouting({
        enableTableSessions: true,
        requireOrderConfirmation: true,
        sessionTokenProvided: false,
        hasValidSessionToken: false,
        resolvedSessionId: null,
      }),
    ).toEqual({
      tableSessionId: null,
      initialStatus: "pending_confirmation",
      sessionEnded: false,
    });
  });

  it("sessions ON + confirmation ON => valid token creates new", () => {
    expect(
      resolvePublicOrderRouting({
        enableTableSessions: true,
        requireOrderConfirmation: true,
        sessionTokenProvided: true,
        hasValidSessionToken: true,
        resolvedSessionId: "session-1",
      }),
    ).toEqual({
      tableSessionId: "session-1",
      initialStatus: "new",
      sessionEnded: false,
    });
  });

  it("sessions ON + confirmation OFF => creates/uses session and creates new", () => {
    expect(
      resolvePublicOrderRouting({
        enableTableSessions: true,
        requireOrderConfirmation: false,
        sessionTokenProvided: false,
        hasValidSessionToken: false,
        resolvedSessionId: "session-2",
      }),
    ).toEqual({
      tableSessionId: "session-2",
      initialStatus: "new",
      sessionEnded: false,
    });
  });

  it("sessions OFF => creates new without table_session_id", () => {
    expect(
      resolvePublicOrderRouting({
        enableTableSessions: false,
        requireOrderConfirmation: false,
        sessionTokenProvided: false,
        hasValidSessionToken: false,
        resolvedSessionId: "session-ignored",
      }),
    ).toEqual({
      tableSessionId: null,
      initialStatus: "new",
      sessionEnded: false,
    });
  });

  it("flags sessionEnded when stale token is sent with confirmation ON", () => {
    expect(
      resolvePublicOrderRouting({
        enableTableSessions: true,
        requireOrderConfirmation: true,
        sessionTokenProvided: true,
        hasValidSessionToken: false,
        resolvedSessionId: null,
      }).sessionEnded,
    ).toBe(true);
  });
});

describe("publicOrderSessionEnded", () => {
  it("is false when sessions are OFF", () => {
    expect(publicOrderSessionEnded(false, true, true, false)).toBe(false);
  });
});
