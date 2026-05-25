"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  const [jobsSelectAllPages, setJobsSelectAllPages] = useState(false);
  const [employersSelectAllPages, setEmployersSelectAllPages] = useState(false);
  const [selectingAllJobs, setSelectingAllJobs] = useState(false);
  const [selectingAllEmployers, setSelectingAllEmployers] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmReason, setConfirmReason] = useState("");
  const [pendingConfirm, setPendingConfirm] = useState<
    | {
        type: "job" | "employer";
        action: "approve" | "reject" | "feature" | "unfeature" | "verify" | "suspend";
        ids: string[];
        requireReason: boolean;
        label: string;
      }
    | null
  >(null);

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
    setJobsSelectAllPages(false);
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
    setEmployersSelectAllPages(false);
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
            {
              description: "Retry with the current filters.",
              action: {
                label: "Retry",
                onClick: () => loadJobs(),
              },
            },
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
            {
              description: "Retry with the current filters.",
              action: {
                label: "Retry",
                onClick: () => loadEmployers(),
              },
            },
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

  const runJobAction = async (
    ids: string[],
    action: "approve" | "reject" | "feature" | "unfeature",
    reason?: string,
  ) => {
    if (!ids.length) {
      toast.error("Select at least one job.");
      return;
    }

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
      setJobsSelectAllPages(false);
      await loadJobs();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error ? error.message : "Unable to update jobs";
      toast.error(message, {
        description: "Retry with the current selection.",
        action: {
          label: "Retry",
          onClick: () => runJobAction(ids, action, reason),
        },
      });
    } finally {
      setPendingAction(null);
    }
  };

  const runEmployerAction = async (
    ids: string[],
    action: "verify" | "suspend",
    reason?: string,
  ) => {
    if (!ids.length) {
      toast.error("Select at least one employer.");
      return;
    }

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
      setEmployersSelectAllPages(false);
      await loadEmployers();
    } catch (error) {
      console.error(error);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to update employers";
      toast.error(message, {
        description: "Retry with the current selection.",
        action: {
          label: "Retry",
          onClick: () => runEmployerAction(ids, action, reason),
        },
      });
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
        setJobsSelectAllPages(false);
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
        setEmployersSelectAllPages(false);
      }
      return next;
    });
  };

  const collectAllJobIds = useCallback(async () => {
    const params = new URLSearchParams();
    if (jobSearch) params.set("q", jobSearch);
    if (jobStatus !== "all") params.set("status", jobStatus);

    const ids: string[] = [];
    let page = 1;
    const pageSize = 50;
    let total = jobTotal;
    while (ids.length < total) {
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/jobs?${params.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to fetch all jobs");
      ids.push(...(data.jobs ?? []).map((job: PendingJob) => job.id));
      total = data.total ?? total;
      if ((data.jobs ?? []).length < pageSize) break;
      page += 1;
    }
    return ids;
  }, [jobSearch, jobStatus, jobTotal]);

  const collectAllEmployerIds = useCallback(async () => {
    const params = new URLSearchParams();
    if (employerSearch) params.set("q", employerSearch);
    if (employerStatus !== "all") params.set("status", employerStatus);

    const ids: string[] = [];
    let page = 1;
    const pageSize = 50;
    let total = employerTotal;
    while (ids.length < total) {
      params.set("page", String(page));
      params.set("pageSize", String(pageSize));
      const res = await fetch(`/api/admin/employers?${params.toString()}`);
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Unable to fetch all employers");
      ids.push(
        ...(data.employers ?? []).map(
          (employer: PendingEmployer) => employer.id,
        ),
      );
      total = data.total ?? total;
      if ((data.employers ?? []).length < pageSize) break;
      page += 1;
    }
    return ids;
  }, [employerSearch, employerStatus, employerTotal]);

  const startConfirm = (
    type: "job" | "employer",
    action: "approve" | "reject" | "feature" | "unfeature" | "verify" | "suspend",
    ids: string[],
    requireReason: boolean,
    label: string,
  ) => {
    setConfirmReason("");
    setPendingConfirm({ type, action, ids, requireReason, label });
    setConfirmOpen(true);
  };

  const performConfirmedAction = async () => {
    if (!pendingConfirm) return;
    const reason = pendingConfirm.requireReason ? confirmReason.trim() : undefined;
    if (pendingConfirm.requireReason && !reason) {
      toast.error("A short reason is required.");
      return;
    }
    setConfirmOpen(false);
    if (pendingConfirm.type === "job") {
      await runJobAction(pendingConfirm.ids, pendingConfirm.action as any, reason);
    } else {
      await runEmployerAction(
        pendingConfirm.ids,
        pendingConfirm.action as any,
        reason,
      );
    }
  };

  const selectedJobsCount = jobsSelectAllPages
    ? jobTotal
    : selectedJobs.size;
  const selectedEmployersCount = employersSelectAllPages
    ? employerTotal
    : selectedEmployers.size;

  const jobFiltersSummary = useMemo(
    () =>
      jobStatus === "all"
        ? "All statuses"
        : jobStatus.replace("_", " ").toLowerCase(),
    [jobStatus],
  );

  const employerFiltersSummary = useMemo(
    () =>
      employerStatus === "all"
        ? "All employers"
        : employerStatus === "pending"
          ? "Pending verification"
        : "Verified",
    [employerStatus],
  );

  const selectAllJobsAcrossPages = async () => {
    setSelectingAllJobs(true);
    try {
      const ids = await collectAllJobIds();
      setSelectedJobs(new Set(ids));
      setJobsSelectAllPages(true);
      toast.success(`Selected all ${ids.length} jobs`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to select all jobs";
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => selectAllJobsAcrossPages(),
        },
      });
    } finally {
      setSelectingAllJobs(false);
    }
  };

  const selectAllEmployersAcrossPages = async () => {
    setSelectingAllEmployers(true);
    try {
      const ids = await collectAllEmployerIds();
      setSelectedEmployers(new Set(ids));
      setEmployersSelectAllPages(true);
      toast.success(`Selected all ${ids.length} employers`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to select all employers";
      toast.error(message, {
        action: {
          label: "Retry",
          onClick: () => selectAllEmployersAcrossPages(),
        },
      });
    } finally {
      setSelectingAllEmployers(false);
    }
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
        <section
          className="space-y-3"
          role="region"
          aria-label="Employer verification panel"
          aria-busy={employersLoading}
        >
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
                  startConfirm(
                    "employer",
                    "verify",
                    Array.from(selectedEmployers),
                    false,
                    `Verify ${selectedEmployersCount} employer(s)?`,
                  )
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
                  startConfirm(
                    "employer",
                    "suspend",
                    Array.from(selectedEmployers),
                    true,
                    `Suspend ${selectedEmployersCount} employer(s)?`,
                  )
                }
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Reject selected
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Employer filters">
            <div className="space-y-1">
              <Label htmlFor="employer-search" className="text-xs text-slate-600">
                Search companies or owners
              </Label>
              <Input
                id="employer-search"
                placeholder="Search company or owner email"
                value={employerSearch}
                onChange={(event) => {
                  setEmployerSearch(event.target.value);
                  setEmployerPage(1);
                  setEmployersSelectAllPages(false);
                  setSelectedEmployers(new Set());
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="employer-status" className="text-xs text-slate-600">
                Status
              </Label>
              <Select
                value={employerStatus}
                onValueChange={(value) => {
                  setEmployerStatus(value as EmployerStatusFilter);
                  setEmployerPage(1);
                  setEmployersSelectAllPages(false);
                  setSelectedEmployers(new Set());
                }}
              >
                <SelectTrigger id="employer-status" aria-label="Employer status filter">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[0.7rem] text-slate-500">
                {employerFiltersSummary}
              </p>
            </div>
            <div className="flex flex-col justify-end gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Checkbox
                  aria-label="Select all employers on this page"
                  checked={
                    employers.length > 0 &&
                    selectedEmployers.size === employers.length &&
                    !employersSelectAllPages
                  }
                  onCheckedChange={(checked) => {
                    setEmployersSelectAllPages(false);
                    setSelectedEmployers(
                      checked
                        ? new Set(employers.map((employer) => employer.id))
                        : new Set(),
                    );
                  }}
                />
                <span>Select page ({employers.length})</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={selectingAllEmployers || employerTotal === 0}
                onClick={selectAllEmployersAcrossPages}
              >
                {selectingAllEmployers ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Select all results ({employerTotal})
              </Button>
              <span className="text-[0.7rem] text-slate-500">
                Selected {selectedEmployersCount} of {employerTotal}
              </span>
            </div>
          </div>
          <div className="space-y-3" role="list">
            {employers.length === 0 && (
              <p className="text-xs text-slate-500">
                No employers awaiting review.
              </p>
            )}
            {employers.map((employer) => (
              <div
                key={employer.id}
                role="listitem"
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    aria-label={`Select ${employer.companyName}`}
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
                    onClick={() =>
                      startConfirm(
                        "employer",
                        "verify",
                        [employer.id],
                        false,
                        `Verify ${employer.companyName}?`,
                      )
                    }
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
                    onClick={() =>
                      startConfirm(
                        "employer",
                        "suspend",
                        [employer.id],
                        true,
                        `Suspend ${employer.companyName}?`,
                      )
                    }
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

        <section
          className="space-y-3"
          role="region"
          aria-label="Job review panel"
          aria-busy={jobsLoading}
        >
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
                onClick={() =>
                  startConfirm(
                    "job",
                    "approve",
                    Array.from(selectedJobs),
                    false,
                    `Approve ${selectedJobsCount} job(s)?`,
                  )
                }
              >
                <CheckCircle className="mr-1 h-3.5 w-3.5" />
                Approve selected
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={jobsBusy || selectedJobs.size === 0}
                onClick={() =>
                  startConfirm(
                    "job",
                    "reject",
                    Array.from(selectedJobs),
                    true,
                    `Reject ${selectedJobsCount} job(s)?`,
                  )
                }
              >
                <XCircle className="mr-1 h-3.5 w-3.5" />
                Reject selected
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3" role="group" aria-label="Job filters">
            <div className="space-y-1">
              <Label htmlFor="job-search" className="text-xs text-slate-600">
                Search jobs
              </Label>
              <Input
                id="job-search"
                placeholder="Search title, company, or location"
                value={jobSearch}
                onChange={(event) => {
                  setJobSearch(event.target.value);
                  setJobPage(1);
                  setJobsSelectAllPages(false);
                  setSelectedJobs(new Set());
                }}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="job-status" className="text-xs text-slate-600">
                Status
              </Label>
              <Select
                value={jobStatus}
                onValueChange={(value) => {
                  setJobStatus(value as JobStatusFilter);
                  setJobPage(1);
                  setJobsSelectAllPages(false);
                  setSelectedJobs(new Set());
                }}
              >
                <SelectTrigger id="job-status" aria-label="Job status filter">
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
              <p className="text-[0.7rem] text-slate-500">
                {jobFiltersSummary}
              </p>
            </div>
            <div className="flex flex-col justify-end gap-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Checkbox
                  aria-label="Select all jobs on this page"
                  checked={
                    jobs.length > 0 &&
                    selectedJobs.size === jobs.length &&
                    !jobsSelectAllPages
                  }
                  onCheckedChange={(checked) => {
                    setJobsSelectAllPages(false);
                    setSelectedJobs(
                      checked ? new Set(jobs.map((job) => job.id)) : new Set(),
                    );
                  }}
                />
                <span>Select page ({jobs.length})</span>
              </div>
              <Button
                variant="secondary"
                size="sm"
                disabled={selectingAllJobs || jobTotal === 0}
                onClick={selectAllJobsAcrossPages}
              >
                {selectingAllJobs ? (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                ) : null}
                Select all results ({jobTotal})
              </Button>
              <span className="text-[0.7rem] text-slate-500">
                Selected {selectedJobsCount} of {jobTotal}
              </span>
            </div>
          </div>
          <div className="space-y-3" role="list">
            {jobs.length === 0 && (
              <p className="text-xs text-slate-500">
                No jobs are waiting for review.
              </p>
            )}
            {jobs.map((job) => (
              <div
                key={job.id}
                role="listitem"
                className="rounded-lg border border-slate-200/70 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      aria-label={`Select ${job.title}`}
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
                    onClick={() =>
                      startConfirm(
                        "job",
                        "approve",
                        [job.id],
                        false,
                        `Approve ${job.title}?`,
                      )
                    }
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
                    onClick={() =>
                      startConfirm(
                        "job",
                        "reject",
                        [job.id],
                        true,
                        `Reject ${job.title}?`,
                      )
                    }
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

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setConfirmReason("");
            setPendingConfirm(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingConfirm?.label ?? "Confirm action"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingConfirm?.type === "job"
                ? "This will update the selected job listings and log the action."
                : "This will update employer verification status."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {pendingConfirm?.requireReason ? (
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs text-slate-700">
                Reason (required)
              </Label>
              <Textarea
                id="reason"
                aria-label="Reason"
                placeholder="Add a short note for audit logs and notifications"
                value={confirmReason}
                onChange={(event) => setConfirmReason(event.target.value)}
                rows={3}
              />
            </div>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void performConfirmedAction()}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
