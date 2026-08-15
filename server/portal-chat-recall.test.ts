import { beforeEach, describe, expect, it, vi } from "vitest";

const { createContextEntryMock, getRecallMessageForUserMock } = vi.hoisted(() => ({
  createContextEntryMock: vi.fn(),
  getRecallMessageForUserMock: vi.fn(),
}));

vi.mock("./portal-chat", () => ({
  createContextEntry: createContextEntryMock,
  getRecallMessageForUser: getRecallMessageForUserMock,
}));

import { portalChatRouter } from "./portal-chat-router";

describe("KEIRA explicit dialogue recall promotion", () => {
  beforeEach(() => {
    createContextEntryMock.mockReset();
    getRecallMessageForUserMock.mockReset();
    createContextEntryMock.mockResolvedValue(81);
    getRecallMessageForUserMock.mockResolvedValue({ id: 42, role: "user", content: "Keep this operator-approved fact." });
  });

  it("promotes only an authenticated operator's stored dialogue into that operator's ledger", async () => {
    const caller = portalChatRouter.createCaller({ user: { id: 7 } } as any);

    const result = await caller.promoteRecallToContextLedger({
      messageId: 42,
      label: "Approved fact",
      kind: "fact",
    });

    expect(getRecallMessageForUserMock).toHaveBeenCalledWith(7, 42);
    expect(createContextEntryMock).toHaveBeenCalledWith(7, {
      label: "Approved fact",
      content: "Keep this operator-approved fact.",
      kind: "fact",
    });
    expect(result).toEqual({ entryId: 81, truncated: false });
  });

  it("rejects a promotion when the stored dialogue is not owned by the operator", async () => {
    getRecallMessageForUserMock.mockResolvedValue(undefined);
    const caller = portalChatRouter.createCaller({ user: { id: 7 } } as any);

    await expect(caller.promoteRecallToContextLedger({ messageId: 99, label: "Denied", kind: "note" }))
      .rejects.toThrow("Stored dialogue message not found or unauthorized");
    expect(createContextEntryMock).not.toHaveBeenCalled();
  });
});
