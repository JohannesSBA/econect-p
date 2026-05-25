import { afterEach, describe, expect, it, vi } from "vitest";

const mockJobListing = { findMany: vi.fn(), count: vi.fn(), update: vi.fn() };
const mockAuditLog = { createMany: vi.fn() };

const mockPrisma = {
  jobListing: mockJobListing,
  adminAuditLog: mockAuditLog,
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ __esModule: true, default: mockPrisma }));
vi.mock("@/generated/prisma", () => ({
  JobStatus: { OPEN: "OPEN", PAUSED: "PAUSED", UNDER_REVIEW: "UNDER_REVIEW" },
  Prisma: {},
}));

const { listJobs, updateJobs } = await import("@/services/adminJobs");

afterEach(() => vi.resetAllMocks());

describe("listJobs", () => {
  it("returns jobs and total count", async () => {
    const fakeJobs = [{ id: "j1", title: "Eng", status: "UNDER_REVIEW" }];
    mockJobListing.findMany.mockResolvedValue(fakeJobs);
    mockJobListing.count.mockResolvedValue(1);

    const result = await listJobs({ page: 1, pageSize: 10 });

    expect(result.jobs).toEqual(fakeJobs);
    expect(result.total).toBe(1);
  });

  it("applies search filter when provided", async () => {
    mockJobListing.findMany.mockResolvedValue([]);
    mockJobListing.count.mockResolvedValue(0);

    await listJobs({ search: "engineer", page: 1, pageSize: 10 });

    expect(mockJobListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.any(Array) }),
      }),
    );
  });

  it("applies status filter when not 'all'", async () => {
    mockJobListing.findMany.mockResolvedValue([]);
    mockJobListing.count.mockResolvedValue(0);

    await listJobs({ status: "OPEN" as any, page: 1, pageSize: 5 });

    expect(mockJobListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: "OPEN" }),
      }),
    );
  });

  it("skips status filter when status is 'all'", async () => {
    mockJobListing.findMany.mockResolvedValue([]);
    mockJobListing.count.mockResolvedValue(0);

    await listJobs({ status: "all" as any, page: 1, pageSize: 5 });

    expect(mockJobListing.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.not.objectContaining({ status: expect.anything() }) }),
    );
  });
});

describe("updateJobs", () => {
  it("approves jobs via $transaction and writes audit log", async () => {
    const updated = [{ id: "j1", status: "OPEN" }];
    mockPrisma.$transaction.mockResolvedValue(updated);
    mockAuditLog.createMany.mockResolvedValue({});

    const result = await updateJobs({ adminId: "admin1", ids: ["j1"], action: "approve" });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockAuditLog.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ actorId: "admin1", action: "JOB_APPROVE", targetId: "j1" }),
        ]),
      }),
    );
    expect(result).toEqual(updated);
  });

  it("rejects jobs with reason in audit log", async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: "j1", status: "PAUSED" }]);
    mockAuditLog.createMany.mockResolvedValue({});

    await updateJobs({ adminId: "admin1", ids: ["j1"], action: "reject", reason: "Spam" });

    expect(mockAuditLog.createMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ action: "JOB_REJECT", details: { reason: "Spam" } }),
        ]),
      }),
    );
  });

  it("handles multiple IDs in a single transaction", async () => {
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);
    mockAuditLog.createMany.mockResolvedValue({});

    await updateJobs({ adminId: "admin1", ids: ["j1", "j2"], action: "feature" });

    expect(mockPrisma.$transaction).toHaveBeenCalledWith(expect.any(Array));
    const calls = (mockPrisma.$transaction.mock.calls[0][0] as unknown[]);
    expect(calls).toHaveLength(2);
  });
});
