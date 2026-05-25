import { afterEach, describe, expect, it, vi } from "vitest";

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));

let prismaMock: { user: { findUnique: ReturnType<typeof vi.fn> } };
vi.mock("@/lib/prisma", () => {
  prismaMock = { user: { findUnique: vi.fn() } };
  return { __esModule: true, default: prismaMock };
});

const { getServerSession } = await import("next-auth/next");
const { requireAdminUser } = await import("@/lib/adminAuth");
const { HttpError } = await import("@/lib/errors");

describe("requireAdminUser (→ requireAdmin)", () => {
  afterEach(() => vi.resetAllMocks());

  it("throws 401 when no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(requireAdminUser()).rejects.toBeInstanceOf(HttpError);
    await expect(requireAdminUser()).rejects.toMatchObject({ status: 401 });
  });

  it("throws 403 for non-admins", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "u1" } });
    prismaMock.user.findUnique.mockResolvedValue({
      id: "u1",
      email: "user@test.com",
      role: "JOB_SEEKER",
      name: null,
      phone: null,
      isSuspended: false,
    });
    await expect(requireAdminUser()).rejects.toMatchObject({ status: 403 });
  });

  it("returns user payload for admins", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id: "admin-1" } });
    const adminUser = {
      id: "admin-1",
      email: "admin@test.com",
      role: "ADMIN",
      name: "Admin",
      phone: null,
      isSuspended: false,
    };
    prismaMock.user.findUnique.mockResolvedValue(adminUser);

    const result = await requireAdminUser();
    expect(result).toMatchObject({ id: "admin-1", role: "ADMIN" });
    expect(prismaMock.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "admin-1" } }),
    );
  });
});
