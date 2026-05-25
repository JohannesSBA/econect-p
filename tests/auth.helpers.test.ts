import { afterEach, describe, expect, it, vi } from "vitest";

process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "test-secret";

vi.mock("next-auth/next", () => ({ getServerSession: vi.fn() }));

let prismaMock: {
  user: { findUnique: ReturnType<typeof vi.fn> };
  jobListing: { findUnique: ReturnType<typeof vi.fn> };
};

vi.mock("@/lib/prisma", () => {
  prismaMock = {
    user: { findUnique: vi.fn() },
    jobListing: { findUnique: vi.fn() },
  };
  return { __esModule: true, default: prismaMock };
});

const { getServerSession } = await import("next-auth/next");
const { requireUser, requireAdmin, requireRole, requireEmployer, requireEmployerOwner } =
  await import("@/lib/auth");
const { HttpError } = await import("@/lib/errors");

const activeAdmin = { id: "a1", email: "admin@test.com", role: "ADMIN", name: "Admin", phone: null, isSuspended: false };
const activeEmployer = { id: "e1", email: "emp@test.com", role: "EMPLOYER", name: "Emp", phone: null, isSuspended: false };
const activeSeeker = { id: "s1", email: "s@test.com", role: "JOB_SEEKER", name: "Seeker", phone: null, isSuspended: false };
const suspendedUser = { id: "x1", email: "x@test.com", role: "JOB_SEEKER", name: "X", phone: null, isSuspended: true };

function mockSession(id: string) {
  (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({ user: { id } });
}

afterEach(() => vi.resetAllMocks());

describe("requireUser", () => {
  it("returns user when authenticated and active", async () => {
    mockSession(activeSeeker.id);
    prismaMock.user.findUnique.mockResolvedValue(activeSeeker);
    const user = await requireUser();
    expect(user.id).toBe(activeSeeker.id);
  });

  it("throws 401 when no session", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });

  it("throws 401 when user not found", async () => {
    mockSession("missing");
    prismaMock.user.findUnique.mockResolvedValue(null);
    await expect(requireUser()).rejects.toMatchObject({ status: 401 });
  });

  it("throws 403 for suspended users", async () => {
    mockSession(suspendedUser.id);
    prismaMock.user.findUnique.mockResolvedValue(suspendedUser);
    await expect(requireUser()).rejects.toMatchObject({ status: 403, message: "Account suspended" });
  });
});

describe("requireAdmin", () => {
  it("allows ADMIN role", async () => {
    mockSession(activeAdmin.id);
    prismaMock.user.findUnique.mockResolvedValue(activeAdmin);
    const user = await requireAdmin();
    expect(user.role).toBe("ADMIN");
  });

  it("throws 403 for non-admin", async () => {
    mockSession(activeSeeker.id);
    prismaMock.user.findUnique.mockResolvedValue(activeSeeker);
    await expect(requireAdmin()).rejects.toMatchObject({ status: 403 });
  });
});

describe("requireEmployer", () => {
  it("allows EMPLOYER role", async () => {
    mockSession(activeEmployer.id);
    prismaMock.user.findUnique.mockResolvedValue(activeEmployer);
    const user = await requireEmployer();
    expect(user.role).toBe("EMPLOYER");
  });

  it("allows ADMIN (employer superset)", async () => {
    mockSession(activeAdmin.id);
    prismaMock.user.findUnique.mockResolvedValue(activeAdmin);
    await expect(requireEmployer()).resolves.toBeDefined();
  });

  it("throws 403 for JOB_SEEKER", async () => {
    mockSession(activeSeeker.id);
    prismaMock.user.findUnique.mockResolvedValue(activeSeeker);
    await expect(requireEmployer()).rejects.toMatchObject({ status: 403 });
  });
});

describe("requireRole", () => {
  it("passes when role matches", () => {
    expect(() => requireRole(activeSeeker, "JOB_SEEKER", "EMPLOYER")).not.toThrow();
  });

  it("throws 403 when role does not match", () => {
    expect(() => requireRole(activeSeeker, "ADMIN")).toThrowError(HttpError);
    expect(() => requireRole(activeSeeker, "ADMIN")).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });
});

describe("requireEmployerOwner", () => {
  it("passes when userId matches job employer", async () => {
    prismaMock.jobListing.findUnique.mockResolvedValue({ employerId: "e1" });
    await expect(requireEmployerOwner("job1", "e1")).resolves.toBeUndefined();
  });

  it("throws 404 when job not found", async () => {
    prismaMock.jobListing.findUnique.mockResolvedValue(null);
    await expect(requireEmployerOwner("missing", "e1")).rejects.toMatchObject({ status: 404 });
  });

  it("throws 403 when user is not the owner", async () => {
    prismaMock.jobListing.findUnique.mockResolvedValue({ employerId: "other" });
    await expect(requireEmployerOwner("job1", "e1")).rejects.toMatchObject({ status: 403 });
  });
});
