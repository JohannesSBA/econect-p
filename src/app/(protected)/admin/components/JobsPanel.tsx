"use client";

import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle, Factory, Loader2, Star, StarOff, XCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type PendingJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  createdAt: string;
  isFeatured: boolean;
  employer: {
    id: string;
    name: string | null;
    email: string;
  };
};

type PendingEmployer = {
  id: string;
  companyName: string;
  isVerified: boolean;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

interface JobsPanelProps {
  pendingJobs: PendingJob[];
  pendingEmployers: PendingEmployer[];
}

export function JobsPanel({ pendingJobs, pendingEmployers }: JobsPanelProps) {
  const [jobs, setJobs] = useState(pendingJobs);
  const [employers, setEmployers] = useState(pendingEmployers);
  const [busy, setBusy] = useState<string | null>(null);

  const updateJob = async (
    jobId: string,
    action: "approve" | "reject" | "feature" | "unfeature",
  ) => {
    setBusy(`${action}:${jobId}`);
    try {
      const res = await fetch("/api/admin/jobs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId, action }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                isFeatured: data.job.isFeatured,
                createdAt: new Date(data.job.createdAt).toISOString(),
              }
            : job,
        ).filter((job) =>
          action === "approve" || action === "reject" ? job.id !== jobId : true,
        ),
      );
      toast.success("Job updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update job");
    } finally {
      setBusy(null);
    }
  };

  const verifyEmployer = async (
    employerProfileId: string,
    action: "verify" | "suspend",
  ) => {
    setBusy(`${action}:${employerProfileId}`);
    try {
      const res = await fetch("/api/admin/employers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employerProfileId, action }),
      });
      if (!res.ok) throw new Error("Request failed");
      await res.json();
      setEmployers((prev) =>
        prev.filter((employer) => employer.id !== employerProfileId),
      );
      toast.success("Employer updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update employer");
    } finally {
      setBusy(null);
    }
  };

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
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Factory className="h-4 w-4 text-blue-500" />
            Pending employers
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
                className="flex flex-wrap items-center justify-between rounded-lg border border-slate-200/70 bg-white px-3 py-2 text-sm shadow-sm"
              >
                <div>
                  <p className="font-semibold text-slate-900">
                    {employer.companyName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {employer.user.name} • {employer.user.email}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy === `verify:${employer.id}`}
                    onClick={() => verifyEmployer(employer.id, "verify")}
                  >
                    {busy === `verify:${employer.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3.5 w-3.5" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy === `suspend:${employer.id}`}
                    onClick={() => verifyEmployer(employer.id, "suspend")}
                  >
                    {busy === `suspend:${employer.id}` ? (
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
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Factory className="h-4 w-4 text-emerald-500" />
            Job listings under review
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
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Badge variant="secondary">
                      {job.employer.name ?? "Employer"}
                    </Badge>
                    {job.isFeatured && (
                      <Badge className="bg-amber-100 text-amber-700">
                        Featured
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy === `approve:${job.id}`}
                    onClick={() => updateJob(job.id, "approve")}
                    className="h-8"
                  >
                    <CheckCircle className="mr-1 h-3.5 w-3.5" />
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={busy === `reject:${job.id}`}
                    onClick={() => updateJob(job.id, "reject")}
                    className="h-8"
                  >
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                    Reject
                  </Button>
                  <Button
                    variant={job.isFeatured ? "secondary" : "outline"}
                    size="sm"
                    disabled={
                      busy === `feature:${job.id}` || busy === `unfeature:${job.id}`
                    }
                    onClick={() =>
                      updateJob(job.id, job.isFeatured ? "unfeature" : "feature")
                    }
                    className="h-8"
                  >
                    {job.isFeatured ? (
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
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
