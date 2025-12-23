"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, PauseCircle, PlayCircle, ShieldBan } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ModeratedUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string;
  location: string | null;
  createdAt: string;
  isSuspended: boolean;
  suspendedAt: string | null;
  shadowBanned: boolean;
  stats: {
    posts: number;
    comments: number;
    jobListings: number;
  };
  employerProfile?: {
    companyName: string | null;
    isVerified: boolean;
  } | null;
};

interface AdminUserTableProps {
  initialUsers: ModeratedUser[];
}

const roleOptions = [
  "ADMIN",
  "MODERATOR",
  "CONTENT_REVIEWER",
  "EMPLOYER",
  "RECRUITER",
  "JOB_SEEKER",
  "STUDENT",
] as const;

export function AdminUserTable({ initialUsers }: AdminUserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (roleFilter !== "all") params.set("role", roleFilter);
        if (statusFilter !== "all") params.set("status", statusFilter);
        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("Failed to load users");
        const data = (await res.json()) as { users: ModeratedUser[] };
        setUsers(
          data.users.map((user) => ({
            ...user,
            createdAt: new Date(user.createdAt).toISOString(),
            suspendedAt: user.suspendedAt
              ? new Date(user.suspendedAt).toISOString()
              : null,
          })),
        );
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(error);
          toast.error("Unable to fetch users");
        }
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query, roleFilter, statusFilter]);

  const handleAction = async (
    userId: string,
    action:
      | "suspend"
      | "unsuspend"
      | "assignRole"
      | "shadow"
      | "unshadow"
      | "resetContact",
    payload?: Record<string, unknown>,
  ) => {
    setPendingAction(`${action}:${userId}`);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, ...payload }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId
            ? {
                ...user,
                ...data.user,
                suspendedAt: data.user.suspendedAt ?? null,
              }
            : user,
        ),
      );
      toast.success("User updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update user");
    } finally {
      setPendingAction(null);
    }
  };

  const resetContact = (userId: string, email: string, phone: string | null) => {
    const newEmail = prompt("Enter new email (leave blank to keep current)", email);
    const newPhone = prompt(
      "Enter new phone (leave blank to keep current)",
      phone ?? "",
    );
    if (!newEmail && !newPhone) return;
    void handleAction(userId, "resetContact", {
      email: newEmail || undefined,
      phone: newPhone || undefined,
    });
  };

  const columns = useMemo(
    () => [
      "User",
      "Role",
      "Status",
      "Activity",
      "Actions",
    ],
    [],
  );

  return (
    <Card className="h-full">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg font-semibold text-slate-900">
              User management
            </CardTitle>
            <p className="text-sm text-slate-500">
              Search, filter, and take action across the entire member base.
            </p>
          </div>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            placeholder="Search by name, email, phone, city…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roleOptions.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="shadow">Shadow banned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-hidden rounded-lg border border-slate-200/80">
          <table className="min-w-full divide-y divide-slate-200/80 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {user.name ?? "Unnamed"}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                    <div className="text-xs text-slate-400">
                      {user.location || "Location unknown"}
                    </div>
                    <div className="text-[0.7rem] text-slate-400">
                      Joined{" "}
                      {new Date(user.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={user.role}
                      onValueChange={(value) =>
                        handleAction(user.id, "assignRole", { role: value })
                      }
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((role) => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {user.employerProfile && (
                      <div className="mt-1 text-[0.7rem] text-slate-500">
                        {user.employerProfile.companyName}{" "}
                        {user.employerProfile.isVerified ? (
                          <Badge className="ml-1 bg-emerald-100 text-emerald-700">
                            Verified
                          </Badge>
                        ) : (
                          <Badge className="ml-1 bg-amber-100 text-amber-700">
                            Pending verification
                          </Badge>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {user.isSuspended && (
                        <Badge variant="destructive" className="text-[0.65rem]">
                          Suspended
                        </Badge>
                      )}
                      {user.shadowBanned && (
                        <Badge className="bg-purple-100 text-purple-700 text-[0.65rem]">
                          Shadow
                        </Badge>
                      )}
                      {!user.isSuspended && !user.shadowBanned && (
                        <Badge className="text-[0.65rem]">Active</Badge>
                      )}
                    </div>
                    {user.isSuspended && user.suspendedAt && (
                      <p className="text-[0.65rem] text-slate-400">
                        Since{" "}
                        {new Date(user.suspendedAt).toLocaleDateString(
                          undefined,
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    <p>
                      Posts:{" "}
                      <span className="font-semibold text-slate-900">
                        {user.stats.posts}
                      </span>
                    </p>
                    <p>
                      Comments:{" "}
                      <span className="font-semibold text-slate-900">
                        {user.stats.comments}
                      </span>
                    </p>
                    <p>
                      Jobs:{" "}
                      <span className="font-semibold text-slate-900">
                        {user.stats.jobListings}
                      </span>
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        disabled={pendingAction === `suspend:${user.id}`}
                        onClick={() =>
                          handleAction(
                            user.id,
                            user.isSuspended ? "unsuspend" : "suspend",
                          )
                        }
                      >
                        {pendingAction === `suspend:${user.id}` ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : user.isSuspended ? (
                          <PlayCircle className="h-3.5 w-3.5" />
                        ) : (
                          <PauseCircle className="h-3.5 w-3.5" />
                        )}
                        {user.isSuspended ? "Unsuspend" : "Suspend"}
                      </Button>
                      <Button
                        variant={user.shadowBanned ? "secondary" : "outline"}
                        size="sm"
                        className="h-8 gap-1"
                        disabled={pendingAction === `shadow:${user.id}`}
                        onClick={() =>
                          handleAction(
                            user.id,
                            user.shadowBanned ? "unshadow" : "shadow",
                          )
                        }
                      >
                        {user.shadowBanned ? "Unshadow" : "Shadow"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1 text-rose-600 hover:text-rose-600"
                        onClick={() =>
                          resetContact(user.id, user.email, user.phone)
                        }
                      >
                        <ShieldBan className="h-3.5 w-3.5" />
                        Reset contact
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
