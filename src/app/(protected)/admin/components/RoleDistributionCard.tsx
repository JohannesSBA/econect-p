"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type RoleSlice = {
  role: string;
  count: number;
};

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrators",
  MODERATOR: "Moderators",
  EMPLOYER: "Employers",
  JOB_SEEKER: "Job seekers",
  RECRUITER: "Recruiters",
};

const ROLE_COLORS: Record<string, string> = {
  ADMIN: "bg-rose-500",
  MODERATOR: "bg-amber-500",
  EMPLOYER: "bg-blue-500",
  JOB_SEEKER: "bg-emerald-500",
  RECRUITER: "bg-purple-500",
};

interface RoleDistributionCardProps {
  data: RoleSlice[];
}

export function RoleDistributionCard({ data }: RoleDistributionCardProps) {
  const total = data.reduce((sum, slice) => sum + slice.count, 0);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Role distribution
        </CardTitle>
        <p className="text-sm text-slate-500">
          Breakdown of active accounts by permission level.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((slice) => {
          const width = total > 0 ? (slice.count / total) * 100 : 0;
          return (
            <div key={slice.role} className="space-y-1">
              <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                <span>{ROLE_LABELS[slice.role] ?? slice.role}</span>
                <span className="text-slate-500">{slice.count}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${ROLE_COLORS[slice.role] ?? "bg-slate-400"}`}
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

