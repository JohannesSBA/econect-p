import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { JobStatus } from "@/generated/prisma";

vi.mock("@/lib/prisma", () => ({
  __esModule: true,
  default: {},
}));

vi.mock("@/lib/auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/services/adminJobs", () => ({
  listJobs: vi.fn(),
  updateJobs: vi.fn(),
}));

vi.mock("@/services/adminEmployers", () => ({
  listEmployers: vi.fn(),
  updateEmployers: vi.fn(),
}));

const { requireAdmin } = await import("@/lib/auth");
const { listJobs, updateJobs } = await import("@/services/adminJobs");
const { listEmployers, updateEmployers } = await import("@/services/adminEmployers");
const { GET: jobsGET, PATCH: jobsPATCH } = await import("@/app/api/admin/jobs/route");
const { GET: employersGET, PATCH: employersPATCH } = await import("@/app/api/admin/employers/route");
const { HttpError } = await import("@/lib/errors");

const adminUser = { id: "admin-1", email: "admin@test.com", role: "ADMIN" };

describe("admin jobs API", () => {
  afterEach(() => vi.resetAllMocks());

  it("returns 401 when requireAdmin throws", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockRejectedValue(new HttpError(401, "Unauthorized"));

    const req = new NextRequest(new Request("http://localhost/api/admin/jobs"));
    const res = await jobsGET(req);
    expect(res.status).toBe(401);
    expect(await res.json()).toMatchObject({ error: "Unauthorized" });
  });

  it("returns paginated jobs on GET", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
    (listJobs as ReturnType<typeof vi.fn>).mockResolvedValue({ jobs: [{ id: "job-1" }], total: 1 });

    const req = new NextRequest(
      new Request("http://localhost/api/admin/jobs?q=fintech&page=2&pageSize=5&status=OPEN"),
    );
    const res = await jobsGET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(listJobs).toHaveBeenCalledWith({
      search: "fintech",
      status: "OPEN" as JobStatus,
      page: 2,
      pageSize: 5,
    });
    expect(data).toMatchObject({ jobs: [{ id: "job-1" }], total: 1, page: 2, pageSize: 5 });
  });

  it("rejects invalid PATCH payloads (missing jobId and action)", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
    const req = new NextRequest(
      new Request("http://localhost/api/admin/jobs", { method: "PATCH", body: "{}" }),
    );
    const res = await jobsPATCH(req);
    expect(res.status).toBe(400);
  });

  it("updates jobs via service on PATCH", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
    (updateJobs as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "job-1", status: "OPEN" }]);

    const req = new NextRequest(
      new Request("http://localhost/api/admin/jobs", {
        method: "PATCH",
        body: JSON.stringify({ jobIds: ["job-1"], action: "approve", reason: "looks good" }),
      }),
    );
    const res = await jobsPATCH(req);
    const data = await res.json();

    expect(updateJobs).toHaveBeenCalledWith({
      adminId: "admin-1",
      ids: ["job-1"],
      action: "approve",
      reason: "looks good",
    });
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ success: true });
  });
});

describe("admin employers API", () => {
  afterEach(() => vi.resetAllMocks());

  it("returns 403 when requireAdmin throws forbidden", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockRejectedValue(new HttpError(403, "Forbidden"));

    const req = new NextRequest(new Request("http://localhost/api/admin/employers"));
    const res = await employersGET(req);
    expect(res.status).toBe(403);
  });

  it("returns paginated employers on GET", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
    (listEmployers as ReturnType<typeof vi.fn>).mockResolvedValue({
      employers: [{ id: "emp-1" }],
      total: 1,
    });

    const req = new NextRequest(
      new Request("http://localhost/api/admin/employers?q=corp&page=3&pageSize=20&status=verified"),
    );
    const res = await employersGET(req);
    const data = await res.json();

    expect(listEmployers).toHaveBeenCalledWith({
      search: "corp",
      status: "verified",
      page: 3,
      pageSize: 20,
    });
    expect(data).toMatchObject({ employers: [{ id: "emp-1" }], total: 1, page: 3, pageSize: 20 });
  });

  it("rejects invalid PATCH payloads (missing ids and action)", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
    const req = new NextRequest(
      new Request("http://localhost/api/admin/employers", { method: "PATCH", body: "{}" }),
    );
    const res = await employersPATCH(req);
    expect(res.status).toBe(400);
  });

  it("updates employers via service on PATCH", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(adminUser);
    (updateEmployers as ReturnType<typeof vi.fn>).mockResolvedValue([{ id: "emp-1", isVerified: true }]);

    const req = new NextRequest(
      new Request("http://localhost/api/admin/employers", {
        method: "PATCH",
        body: JSON.stringify({ employerProfileId: "emp-1", action: "verify", reason: "docs ok" }),
      }),
    );
    const res = await employersPATCH(req);
    const data = await res.json();

    expect(updateEmployers).toHaveBeenCalledWith({
      adminId: "admin-1",
      ids: ["emp-1"],
      action: "verify",
      reason: "docs ok",
    });
    expect(res.status).toBe(200);
    expect(data).toMatchObject({ success: true });
  });
});
