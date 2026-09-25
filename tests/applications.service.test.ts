import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const txMock = {
  jobApplication: { create: vi.fn(), update: vi.fn() },
  notification: { create: vi.fn() },
};

const mockPrisma = {
  jobListing: { findFirst: vi.fn(), findUnique: vi.fn() },
  jobApplication: { findUnique: vi.fn() },
  $transaction: vi.fn(),
};

vi.mock("@/lib/prisma", () => ({ __esModule: true, default: mockPrisma }));

const { applyToJob, updateApplicationStatus } = await import("@/services/applications");

// Re-wire $transaction to execute the callback each time (resetAllMocks wipes the impl).
beforeEach(() => {
  mockPrisma.$transaction.mockImplementation((fn: (tx: typeof txMock) => unknown) => fn(txMock));
});

afterEach(() => vi.resetAllMocks());

const openJob = {
  id: "job1",
  title: "Engineer",
  company: "Acme",
  employerId: "emp1",
  status: "OPEN",
  isPublished: true,
};

describe("applyToJob", () => {
  it("creates an application for a valid open job", async () => {
    mockPrisma.jobListing.findFirst.mockResolvedValue(openJob);
    mockPrisma.jobApplication.findUnique.mockResolvedValue(null);
    txMock.jobApplication.create.mockResolvedValue({ id: "app1", userId: "s1", jobId: "job1" });
    txMock.notification.create.mockResolvedValue({});

    const result = await applyToJob({
      userId: "s1",
      userName: "Alice",
      jobId: "job1",
      resumeUrl: "https://cdn.example.com/resume.pdf",
    });

    expect(result.id).toBe("app1");
    expect(txMock.jobApplication.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PENDING" }) }),
    );
  });

  it("notifies the employer on new application", async () => {
    mockPrisma.jobListing.findFirst.mockResolvedValue(openJob);
    mockPrisma.jobApplication.findUnique.mockResolvedValue(null);
    txMock.jobApplication.create.mockResolvedValue({ id: "app1", userId: "s1", jobId: "job1" });
    txMock.notification.create.mockResolvedValue({});

    await applyToJob({ userId: "s1", userName: "Alice", jobId: "job1", resumeUrl: "https://cdn.example.com/r.pdf" });

    expect(txMock.notification.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "emp1", type: "APPLICATION_UPDATE" }),
      }),
    );
  });

  it("throws 404 when job is not found or closed", async () => {
    mockPrisma.jobListing.findFirst.mockResolvedValue(null);

    await expect(
      applyToJob({ userId: "s1", userName: "Alice", jobId: "bad", resumeUrl: "https://cdn.example.com/r.pdf" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 409 when already applied", async () => {
    mockPrisma.jobListing.findFirst.mockResolvedValue(openJob);
    mockPrisma.jobApplication.findUnique.mockResolvedValue({ id: "existing" });

    await expect(
      applyToJob({ userId: "s1", userName: "Alice", jobId: "job1", resumeUrl: "https://cdn.example.com/r.pdf" }),
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("updateApplicationStatus", () => {
  const existingApp = { id: "app1", userId: "s1", jobId: "job1" };
  const jobRecord = { employerId: "emp1", title: "Engineer", company: "Acme" };

  it("allows employer to update their job's application", async () => {
    mockPrisma.jobApplication.findUnique.mockResolvedValue(existingApp);
    mockPrisma.jobListing.findUnique.mockResolvedValue(jobRecord);
    const updatedApp = { ...existingApp, status: "REVIEWING", user: { id: "s1", name: "Alice", email: "a@b.com" } };
    txMock.jobApplication.update.mockResolvedValue(updatedApp);
    txMock.notification.create.mockResolvedValue({});

    const result = await updateApplicationStatus({
      applicationId: "app1",
      status: "REVIEWING",
      actorId: "emp1",
      actorRole: "EMPLOYER",
    });
    expect(result.application.status).toBe("REVIEWING");
  });

  it("throws 403 when non-owner tries to update", async () => {
    mockPrisma.jobApplication.findUnique.mockResolvedValue(existingApp);
    mockPrisma.jobListing.findUnique.mockResolvedValue(jobRecord);

    await expect(
      updateApplicationStatus({
        applicationId: "app1",
        status: "REJECTED",
        actorId: "other",
        actorRole: "EMPLOYER",
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("allows ADMIN to update any application", async () => {
    mockPrisma.jobApplication.findUnique.mockResolvedValue(existingApp);
    mockPrisma.jobListing.findUnique.mockResolvedValue(jobRecord);
    const updatedApp = { ...existingApp, status: "REJECTED", user: { id: "s1", name: "Alice", email: "a@b.com" } };
    txMock.jobApplication.update.mockResolvedValue(updatedApp);
    txMock.notification.create.mockResolvedValue({});

    await expect(
      updateApplicationStatus({
        applicationId: "app1",
        status: "REJECTED",
        actorId: "admin1",
        actorRole: "ADMIN",
      }),
    ).resolves.toBeDefined();
  });

  it("throws 404 for missing application", async () => {
    mockPrisma.jobApplication.findUnique.mockResolvedValue(null);

    await expect(
      updateApplicationStatus({
        applicationId: "missing",
        status: "REVIEWING",
        actorId: "emp1",
        actorRole: "EMPLOYER",
      }),
    ).rejects.toMatchObject({ status: 404 });
  });
});
