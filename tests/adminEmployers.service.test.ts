import { afterEach, describe, expect, it, vi } from "vitest";

const mockEmployerProfile = { findMany: vi.fn(), count: vi.fn(), update: vi.fn() };
const mockAuditLog = { createMany: vi.fn() };

const mockPrisma = {
  employerProfile: mockEmployerProfile,
  adminAuditLog: mockAuditLog,
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ __esModule: true, default: mockPrisma }));
vi.mock("@/generated/prisma", () => ({ Prisma: {} }));

const { listEmployers, updateEmployers } = await import("@/services/adminEmployers");

afterEach(() => vi.resetAllMocks());

describe("listEmployers", () => {
  it("returns employers and total count", async () => {
    const fakeEmployers = [{ id: "ep1", companyName: "Acme", isVerified: false }];
    mockEmployerProfile.findMany.mockResolvedValue(fakeEmployers);
    mockEmployerProfile.count.mockResolvedValue(1);

    const result = await listEmployers({ page: 1, pageSize: 10 });

    expect(result.employers).toEqual(fakeEmployers);
    expect(result.total).toBe(1);
  });

  it("filters by pending (isVerified: false) when status is 'pending'", async () => {
    mockEmployerProfile.findMany.mockResolvedValue([]);
    mockEmployerProfile.count.mockResolvedValue(0);

    await listEmployers({ status: "pending", page: 1, pageSize: 10 });

    expect(mockEmployerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isVerified: false }),
      }),
    );
  });

  it("filters by verified (isVerified: true) when status is 'verified'", async () => {
    mockEmployerProfile.findMany.mockResolvedValue([]);
    mockEmployerProfile.count.mockResolvedValue(0);

    await listEmployers({ status: "verified", page: 1, pageSize: 10 });

    expect(mockEmployerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ isVerified: true }),
      }),
    );
  });

  it("applies search filter when provided", async () => {
    mockEmployerProfile.findMany.mockResolvedValue([]);
    mockEmployerProfile.count.mockResolvedValue(0);

    await listEmployers({ search: "acme", page: 1, pageSize: 10 });

    expect(mockEmployerProfile.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });
});

describe("updateEmployers", () => {
  it("verifies employers via $transaction and writes audit log", async () => {
    const updated = [{ id: "ep1", isVerified: true }];
    mockPrisma.$transaction.mockResolvedValue(updated);
    mockAuditLog.createMany.mockResolvedValue({});

    const result = await updateEmployers({ adminId: "admin1", ids: ["ep1"], action: "verify" });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockAuditLog.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ actorId: "admin1", action: "EMPLOYER_VERIFY", targetId: "ep1" }),
        ]),
      }),
    );
    expect(result).toEqual(updated);
  });

  it("suspends employers with reason in audit log", async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: "ep1", isVerified: false }]);
    mockAuditLog.createMany.mockResolvedValue({});

    await updateEmployers({
      adminId: "admin1",
      ids: ["ep1"],
      action: "suspend",
      reason: "Policy violation",
    });

    expect(mockAuditLog.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({
            action: "EMPLOYER_SUSPEND",
            details: { reason: "Policy violation" },
          }),
        ]),
      }),
    );
  });

  it("handles multiple IDs in a single transaction", async () => {
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);
    mockAuditLog.createMany.mockResolvedValue({});

    await updateEmployers({ adminId: "admin1", ids: ["ep1", "ep2"], action: "verify" });

    const calls = (mockPrisma.$transaction.mock.calls[0][0] as unknown[]);
    expect(calls).toHaveLength(2);
  });
});
