import { afterEach, describe, expect, it, vi } from "vitest";

const mockPrisma = {
  jobListing: { findUnique: vi.fn() },
  payment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ __esModule: true, default: mockPrisma }));

const mockLogger = { error: vi.fn(), info: vi.fn(), debug: vi.fn(), warn: vi.fn() };
const { initiateChapaCheckout, confirmChapaPayment } = await import("@/services/payments");
const { HttpError } = await import("@/lib/errors");

const employer = { id: "emp1", email: "e@test.com", role: "EMPLOYER", name: "Emp Co", phone: "0911" };
const openJob = { id: "job1", title: "Dev", company: "Acme", employerId: "emp1" };

afterEach(() => {
  vi.resetAllMocks();
  delete process.env.CHAPA_SECRET_KEY;
  delete process.env.CHAPA_DEV_CONFIRM;
});

describe("initiateChapaCheckout", () => {
  it("throws 403 for non-employer roles", async () => {
    await expect(
      initiateChapaCheckout({
        user: { ...employer, role: "JOB_SEEKER" },
        payload: { jobId: "job1" },
        logger: mockLogger as any,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws 404 if job not found or not owned", async () => {
    mockPrisma.jobListing.findUnique.mockResolvedValue(null);
    await expect(
      initiateChapaCheckout({ user: employer, payload: { jobId: "bad" }, logger: mockLogger as any }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 404 if employer does not own the job", async () => {
    mockPrisma.jobListing.findUnique.mockResolvedValue({ ...openJob, employerId: "other" });
    await expect(
      initiateChapaCheckout({ user: employer, payload: { jobId: "job1" }, logger: mockLogger as any }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("applies FREE discount code and creates PAID payment without hitting Chapa", async () => {
    mockPrisma.jobListing.findUnique.mockResolvedValue(openJob);
    mockPrisma.payment.create.mockResolvedValue({ id: "pay1" });

    const result = await initiateChapaCheckout({
      user: employer,
      payload: { jobId: "job1", discountCode: "FREE100" },
      logger: mockLogger as any,
    });

    expect(result.discountApplied).toBe(true);
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID", amount: 0 }) }),
    );
  });

  it("throws 500 when CHAPA_SECRET_KEY is missing", async () => {
    mockPrisma.jobListing.findUnique.mockResolvedValue(openJob);
    mockPrisma.payment.create.mockResolvedValue({ id: "pay1" });

    await expect(
      initiateChapaCheckout({
        user: employer,
        payload: { jobId: "job1", amount: 500 },
        logger: mockLogger as any,
      }),
    ).rejects.toMatchObject({ status: 500 });
  });
});

describe("confirmChapaPayment", () => {
  it("throws 404 for unknown payment", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue(null);
    await expect(
      confirmChapaPayment({ user: employer, paymentId: "bad", logger: mockLogger as any }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws 403 if payment belongs to a different employer", async () => {
    mockPrisma.payment.findUnique.mockResolvedValue({ id: "pay1", employerId: "other", reference: "ref1" });
    await expect(
      confirmChapaPayment({ user: employer, paymentId: "pay1", logger: mockLogger as any }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("confirms payment in dev mode without calling Chapa", async () => {
    process.env.CHAPA_DEV_CONFIRM = "true";
    mockPrisma.payment.findUnique.mockResolvedValue({ id: "pay1", employerId: "emp1", reference: "ref1", jobId: "job1" });
    mockPrisma.payment.update.mockResolvedValue({ id: "pay1", status: "PAID" });

    const result = await confirmChapaPayment({ user: employer, paymentId: "pay1", logger: mockLogger as any });
    expect(result.ok).toBe(true);
    expect(result.mode).toBe("dev");
    expect(mockPrisma.payment.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "PAID" }) }),
    );
  });
});
