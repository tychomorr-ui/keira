import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const { dbMock, authMock } = vi.hoisted(() => ({
  dbMock: {
    getUserByName: vi.fn(),
    getUserByEmail: vi.fn(),
    provisionInitialKeiraOwner: vi.fn(),
    promoteUserToOwner: vi.fn(),
  },
  authMock: {
    isValidOwnerAccessToken: vi.fn(),
    createSessionToken: vi.fn(),
    setSessionCookie: vi.fn(),
    clearSessionCookie: vi.fn(),
    hashPassword: vi.fn(),
    verifyPassword: vi.fn(),
  },
}));

vi.mock("./db", () => dbMock);
vi.mock("./sovereign-auth", () => authMock);

import { appRouter } from "./routers";

const owner = {
  id: 81,
  name: "Tyler Morris",
  email: "tycole716@gmail.com",
  role: "admin" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("auth.ownerBootstrap first-owner provisioning", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    authMock.isValidOwnerAccessToken.mockReturnValue(true);
    authMock.createSessionToken.mockResolvedValue("session-token");
    dbMock.getUserByName.mockResolvedValue(undefined);
    dbMock.getUserByEmail.mockResolvedValue(undefined);
    dbMock.provisionInitialKeiraOwner.mockResolvedValue(owner);
    dbMock.promoteUserToOwner.mockResolvedValue(owner);
  });

  it("provisions the fixed initial owner only after the private owner key succeeds", async () => {
    const result = await appRouter.createCaller(createContext()).auth.ownerBootstrap({ token: "valid-owner-key" });

    expect(authMock.isValidOwnerAccessToken).toHaveBeenCalledWith("valid-owner-key");
    expect(dbMock.provisionInitialKeiraOwner).toHaveBeenCalledTimes(1);
    expect(dbMock.promoteUserToOwner).toHaveBeenCalledWith(owner.id);
    expect(authMock.setSessionCookie).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: owner.id, role: "admin" });
  });

  it("rejects an invalid key before looking up or provisioning any owner", async () => {
    authMock.isValidOwnerAccessToken.mockReturnValue(false);

    await expect(appRouter.createCaller(createContext()).auth.ownerBootstrap({ token: "invalid-owner-key" }))
      .rejects.toMatchObject({ code: "UNAUTHORIZED" });

    expect(dbMock.getUserByName).not.toHaveBeenCalled();
    expect(dbMock.provisionInitialKeiraOwner).not.toHaveBeenCalled();
  });
});
