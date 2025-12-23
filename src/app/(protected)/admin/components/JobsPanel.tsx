"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Factory, Loader2, Star, StarOff, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type JobStatusFilter = "UNDER_REVIEW" | "OPEN" | "PAUSED" | "CLOSED" | "all";
type EmployerStatusFilter = "pending" | "verified" | "all";

const JOB_PAGE_SIZE = 10;
const EMPLOYER_PAGE_SIZE = 10;

type PendingJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  createdAt: string;
  isFeatured: boolean;
  status: string;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  employer: {
    id: string;
    name: string | null;
    email: string;
  };
  reviewedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

type PendingEmployer = {
  id: string;
  companyName: string;
  isVerified: boolean;
  createdAt?: string;
  verificationNote?: string | null;
  verifiedAt?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  verifiedBy?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

interface JobsPanelProps {
  pendingJobs: PendingJob[];
  pendingEmployers: PendingEmployer[];
}

export function JobsPanel({ pendingJobs, pendingEmployers }: JobsPanelProps) {
  const normalizeJob = (job: PendingJob): PendingJob => ({
    ...job,
    status: job.status ?? "UNDER_REVIEW",
    createdAt: new Date(job.createdAt).toISOString(),
    reviewedAt: job.reviewedAt ? new Date(job.reviewedAt).toISOString() : null,
    reviewNote: job.reviewNote ?? null,
  });
  const normalizeEmployer = (employer: PendingEmployer): PendingEmployer => ({
    ...employer,
    createdAt: employer.createdAt
      ? new Date(employer.createdAt).toISOString()
      : employer.createdAt,
    verifiedAt: employer.verifiedAt
      ? new Date(employer.verifiedAt).toISOString()
      : null,
    verificationNote: employer.verificationNote ?? null,
  });

  const [jobs, setJobs] = useState(pendingJobs.map(normalizeJob));
  const [employers, setEmployers] = useState(
    pendingEmployers.map(normalizeEmployer),
  );
  const [jobSearch, setJobSearch] = useState("");
  const [jobStatus, setJobStatus] = useState<JobStatusFilter>("UNDER_REVIEW");
  const [jobPage, setJobPage] = useState(1);
  const [jobTotal, setJobTotal] = useState(pendingJobs.length);
  const [employerSearch, setEmployerSearch] = useState("");
  const [employerStatus, setEmployerStatus] =
    useState<EmployerStatusFilter>("pending");
  const [employerPage, setEmployerPage] = useState(1);
  const [employerTotal, setEmployerTotal] = useState(
    pendingEmployers.length,
  );
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [employersLoading, setEmployersLoading] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [selectedEmployers, setSelectedEmployers] = useState<Set<string>>(
    new Set(),
  );

  const jobPages = Math.max(1, Math.ceil(jobTotal / JOB_PAGE_SIZE));
  const employerPages = Math.max(
    1,
    Math.ceil(employerTotal / EMPLOYER_PAGE_SIZE),
  );

  useEffect(() => {
    setSelectedJobs(
      (prev) =>
        new Set([...prev].filter((id) => jobs.some((job) => job.id === id))),
    );
  }, [jobs]);

  useEffect(() => {
    setSelectedEmployers(
      (prev) =>
        new Set(
          [...prev].filter((id) =>
            employers.some((employer) => employer.id === id),
          ),
        ),
    );
  }, [employers]);

  const loadJobs = useCallback(
    async (signal?: AbortSignal) => {
      setJobsLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(jobPage),
          pageSize: String(JOB_PAGE_SIZE),
        });
        if (jobSearch) params.set("q", jobSearch);
        if (jobStatus !== "all") params.set("status", jobStatus);
        const res = await fetch(`/api/admin/jobs?${params.toString()}`, {
          signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to fetch jobs");
        setJobs((data.jobs ?? []).map(normalizeJob));
        setJobTotal(data.total ?? data.jobs?.length ?? 0);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
          toast.error(
            error instanceof Error ? error.message : "Unable to fetch jobs",
          );
        }
      } finally {
        if (!signal?.aborted) {
          setJobsLoading(false);
        }
      }
    },
    [jobPage, jobSearch, jobStatus],
  );

  const loadEmployers = useCallback(
    async (signal?: AbortSignal) => {
      setEmployersLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(employerPage),
          pageSize: String(EMPLOYER_PAGE_SIZE),
        });
        if (employerSearch) params.set("q", employerSearch);
        if (employerStatus !== "all") params.set("status", employerStatus);
        const res = await fetch(`/api/admin/employers?${params.toString()}`, {
          signal,
        });
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Unable to fetch employers");
        setEmployers((data.employers ?? []).map(normalizeEmployer));
        setEmployerTotal(data.total ?? data.employers?.length ?? 0);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
          toast.error(
            error instanceof Error
              ? error.message
              : "Unable to fetch employers",
          );
        }
      } finally {
        if (!signal?.aborted) {
          setEmployersLoading(false);
        }
      }
    },
    [employerPage, employerSearch, employerStatus],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void loadJobs(controller.signal);
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [loadJobs]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void loadEmployers(controller.signal);
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [loadEmployers]);

  const confirmAction = (
    label: string,
    requireReason = false,
  ): { confirmed: boolean; reason?: string } => {
    const confirmed = window.confirm(label);
    if (!confirmed) return { confirmed: false };
    if (requireReason) {
      const reason = window.prompt("Add a short reason (required)")?.trim();
      if (!reason) {
        toast.error("A reason is required.");
        return { confirmed: false };
      }
      return { confirmed: true, reason };
    }
    return { confirmed: true };
  };

  const runJobAction = async (
    ids: string[],
    action: "approve" | "reject" | "feature" | "unfeature",
  ) => {
    if (!ids.length) {
      toast.error("Select at least one job.");
      return;
    }
    const { confirmed, reason } = confirmAction(
      `Proceed to ${action} ${ids.length} job${ids.length > 1 ? "s" : ""}?`,
      action === "reject",
    );
    if (!confirmed) return;

    setPendingAction(`job:${action}`);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, jobIds: ids, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update jobs");
      toast.success("Jobs updated");
      setSelectedJobs(new Set());
      await loadJobs();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error ? error.message : "Unable to update jobs",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const runEmployerAction = async (
    ids: string[],
    action: "verify" | "suspend",
  ) => {
    if (!ids.length) {
      toast.error("Select at least one employer.");
      return;
    }
    const { confirmed, reason } = confirmAction(
      `Proceed to ${action} ${ids.length} employer${ids.length > 1 ? "s" : ""}?`,
      action === "suspend",
    );
    if (!confirmed) return;

    setPendingAction(`employer:${action}`);
    try {
      const res = await fetch("/api/admin/employers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          employerProfileIds: ids,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update employers");
      toast.success("Employers updated");
      setSelectedEmployers(new Set());
      await loadEmployers();
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to update employers",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const toggleJobSelection = (id: string, checked: boolean) => {
    setSelectedJobs((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const toggleEmployerSelection = (id: string, checked: boolean) => {
    setSelectedEmployers((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const renderPagination = (
    page: number,
    totalPages: number,
    onChange: (page: number) => void,
  ) => (
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span>
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );

  const jobsBusy = pendingAction?.startsWith("job:") ?? false;
  const employersBusy = pendingAction?.startsWith("employer:") ?? false;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Jobs & employers
        </CardTitle>
        <p className="text-sm text-slate-500">
          Approve job listings and verify company accounts before they go live.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-blue-500" />
              Pending employers
              {employersLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={
                  employersBusy || selectedEmployers.size === 0
                }
                onClick={() =>
                  runEmployerAction(Array.from(selectedEmployers), "verify")
                }
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Approve selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={
                  employersBusy || selectedEmployers.size === 0
                }
                onClick={() =>
                  runEmployerAction(Array.from(selectedEmployers), "suspend")
                }
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Reject selected
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Search company or owner email"
              value={employerSearch}
              onChange={(event) => {
                setEmployerSearch(event.target.value);
                setEmployerPage(1);
              }}
              className="w-full"
            />
            <Select
              value={employerStatus}
              onValueChange={(value) => {
                setEmployerStatus(value as EmployerStatusFilter);
                setEmployerPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Checkbox
                checked={
                  employers.length > 0 &&
                  selectedEmployers.size === employers.length
                }
                onCheckedChange={(checked) =>
                  setSelectedEmployers(
                    checked
                      ? new Set(employers.map((employer) => employer.id))
                      : new Set(),
                  )
                }
              />
              <span>Select all on page</span>
            </div>
          </div>
          <div className="space-y-3">
            {employers.length === 0 && (
              <p className="text-xs text-slate-500">
                No employers awaiting review.
              </p>
            )}
            {employers.map((employer) => (
              <div
                key={employer.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedEmployers.has(employer.id)}
                    onCheckedChange={(checked) =>
                      toggleEmployerSelection(employer.id, Boolean(checked))
                    }
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-slate-900">
                      {employer.companyName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {employer.user.name} • {employer.user.email}
                    </p>
                    <p className="text-[0.7rem] text-slate-400">
                      Requested on {" "}
                      {employer.createdAt
                        ? new Date(employer.createdAt).toLocaleDateString()
                        : "—"}
                    </p>
                    {employer.verificationNote && (
                      <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-[0.72rem] text-amber-700">
                        Note: {employer.verificationNote}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={employersBusy}
                    onClick={() => runEmployerAction([employer.id], "verify")}
                  >
                    {employersBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={employersBusy}
                    onClick={() => runEmployerAction([employer.id], "suspend")}
                  >
                    {employersBusy ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5" />
                    )}
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {renderPagination(employerPage, employerPages, setEmployerPage)}
        </section>

        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Factory className="h-4 w-4 text-emerald-500" />
              Job listings under review
              {jobsLoading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={jobsBusy || selectedJobs.size === 0}
                onClick={() => runJobAction(Array.from(selectedJobs), "approve")}
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Approve selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={jobsBusy || selectedJobs.size === 0}
                onClick={() => runJobAction(Array.from(selectedJobs), "reject")}
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Reject selected
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input
              placeholder="Search title, company, or location"
              value={jobSearch}
              onChange={(event) => {
                setJobSearch(event.target.value);
                setJobPage(1);
              }}
              className="w-full"
            />
            <Select
              value={jobStatus}
              onValueChange={(value) => {
                setJobStatus(value as JobStatusFilter);
                setJobPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UNDER_REVIEW">Under review</SelectItem>
                <SelectItem value="OPEN">Approved</SelectItem>
                <SelectItem value="PAUSED">Rejected/Paused</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Checkbox
                checked={jobs.length > 0 && selectedJobs.size === jobs.length}
                onCheckedChange={(checked) =>
                  setSelectedJobs(
                    checked ? new Set(jobs.map((job) => job.id)) : new Set(),
                  )
                }
              />
              <span>Select all on page</span>
            </div>
          </div>
          <div className="space-y-3">
            {jobs.length === 0 && (
              <p className="text-xs text-slate-500">
                No jobs are waiting for review.
              </p>
            )}
            {jobs.map((job) => (
              <div
                key={job.id}
                className="rounded-lg border border-slate-200/70 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedJobs.has(job.id)}
                      onCheckedChange={(checked) =>
                        toggleJobSelection(job.id, Boolean(checked))
                      }
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {job.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {job.company} • {job.location}
                      </p>
                      <p className="text-[0.7rem] text-slate-400">
                        Submitted{" "}
                        {new Date(job.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[0.7rem] text-slate-600">
                        <Badge variant="secondary">
                          {job.employer.name ?? "Employer"}
                        </Badge>
                        <Badge variant="outline" className="text-[0.7rem]">
                          {job.status.replace("_", " ")}
                        </Badge>
                        {job.isFeatured && (
                          <Badge className="bg-amber-100 text-amber-700">
                            Featured
                          </Badge>
                        )}
                        {job.reviewedAt && (
                          <span className="text-slate-500">
                            Reviewed {new Date(job.reviewedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {job.reviewNote && (
                        <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-[0.72rem] text-amber-700">
                          Review note: {job.reviewNote}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={jobsBusy}
                      onClick={() => runJobAction([job.id], "approve")}
                      className="h-8"
                    >
                      {jobsBusy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-1 h-3.5 w-3.5" />
                      )}
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={jobsBusy}
                      onClick={() => runJobAction([job.id], "reject")}
                      className="h-8"
                    >
                      {jobsBusy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                      )}
                      Reject
                    </Button>
                    <Button
                      variant={job.isFeatured ? "secondary" : "outline"}
                      size="sm"
                      disabled={jobsBusy}
                      onClick={() =>
                        runJobAction(
                          [job.id],
                          job.isFeatured ? "unfeature" : "feature",
                        )
                      }
                      className="h-8"
                    >
                      {jobsBusy ? (
                        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                      ) : job.isFeatured ? (
                        <>
                          <StarOff className="mr-1 h-3.5 w-3.5" />
                          Remove feature
                        </>
                      ) : (
                        <>
                          <Star className="mr-1 h-3.5 w-3.5" />
                          Feature
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {renderPagination(jobPage, jobPages, setJobPage)}
        </section>
      </CardContent>
    </Card>
  );
}
