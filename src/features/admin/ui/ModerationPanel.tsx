"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  ImageOff,
  MessageSquareWarning,
  Loader2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const MODERATION_REASONS = [
  "Spam",
  "Hate speech",
  "Harassment",
  "Misinformation",
  "Sexual content",
  "Violence",
  "Other",
];

type ReportedPost = {
  id: string;
  content: string;
  createdAt: string;
  isVisible: boolean;
  moderationReason: string | null;
  author: {
    id: string;
    name: string | null;
    email: string;
  };
  reports: {
    id: string;
    reason: string;
  }[];
};

type CommentEntry = {
  id: string;
  content: string;
  createdAt: string;
  isVisible: boolean;
  moderationReason: string | null;
  user: {
    id: string;
    name: string | null;
  };
  post: {
    id: string;
    title: string | null;
  };
};

interface ModerationPanelProps {
  reportedPosts: ReportedPost[];
  recentComments: CommentEntry[];
}

export function ModerationPanel({
  reportedPosts,
  recentComments,
}: ModerationPanelProps) {
  const [posts, setPosts] = useState(reportedPosts);
  const [comments, setComments] = useState(recentComments);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const updateResource = async (
    resourceType: "post" | "comment",
    resourceId: string,
    action: "hide" | "restore",
  ) => {
    setBusyId(`${resourceType}:${resourceId}`);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType,
          resourceId,
          action,
          reason: action === "hide" ? reasons[resourceId] ?? "Spam" : null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      if (resourceType === "post") {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === resourceId
              ? {
                  ...post,
                  isVisible: data.post.isVisible,
                  moderationReason: data.post.moderationReason,
                }
              : post,
          ),
        );
      } else {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === resourceId
              ? {
                  ...comment,
                  isVisible: data.comment.isVisible,
                  moderationReason: data.comment.moderationReason,
                }
              : comment,
          ),
        );
      }
      toast.success("Moderation updated");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update moderation state");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          Content moderation
        </CardTitle>
        <p className="text-sm text-slate-500">
          Review reported posts, comments, and apply policy decisions.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Reported posts
          </div>
          <div className="space-y-3">
            {posts.length === 0 && (
              <p className="text-xs text-slate-500">No reported posts 🎉</p>
            )}
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-lg border border-slate-200/80 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {post.author.name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-slate-500">{post.author.email}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(post.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {post.reports.length} report
                      {post.reports.length !== 1 ? "s" : ""}
                    </Badge>
                    {post.isVisible ? (
                      <Badge>Visible</Badge>
                    ) : (
                      <Badge variant="destructive">Hidden</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700 line-clamp-3">
                  {post.content}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  {post.reports.map((report) => (
                    <Badge key={report.id} className="bg-rose-100 text-rose-700">
                      {report.reason}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {!post.isVisible && post.moderationReason && (
                    <p className="text-xs text-slate-500">
                      Hidden for {post.moderationReason}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {!post.isVisible ? null : (
                      <Select
                        value={reasons[post.id] ?? "Spam"}
                        onValueChange={(value) =>
                          setReasons((prev) => ({ ...prev, [post.id]: value }))
                        }
                      >
                        <SelectTrigger className="h-8 w-[160px] text-xs">
                          <SelectValue placeholder="Reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODERATION_REASONS.map((reason) => (
                            <SelectItem key={reason} value={reason}>
                              {reason}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Button
                      variant={post.isVisible ? "destructive" : "outline"}
                      size="sm"
                      disabled={busyId === `post:${post.id}`}
                      onClick={() =>
                        updateResource(
                          "post",
                          post.id,
                          post.isVisible ? "hide" : "restore",
                        )
                      }
                      className="h-8 gap-1"
                    >
                      {busyId === `post:${post.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : post.isVisible ? (
                        <EyeOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {post.isVisible ? "Hide" : "Restore"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <MessageSquareWarning className="h-4 w-4 text-blue-500" />
            Recent comments
          </div>
          <div className="space-y-3">
            {comments.length === 0 && (
              <p className="text-xs text-slate-500">No comments yet.</p>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-lg border border-slate-200/70 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{comment.user.name ?? "User"}</span>
                  <span>
                    {new Date(comment.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-700 line-clamp-2">
                  {comment.content}
                </p>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                  <span>Post: {comment.post.title ?? comment.post.id}</span>
                  <div className="flex items-center gap-2">
                    {!comment.isVisible && comment.moderationReason && (
                      <Badge
                        variant="secondary"
                        className="text-[0.6rem] text-rose-600"
                      >
                        {comment.moderationReason}
                      </Badge>
                    )}
                    <Button
                      variant={comment.isVisible ? "outline" : "secondary"}
                      size="sm"
                      disabled={busyId === `comment:${comment.id}`}
                      onClick={() =>
                        updateResource(
                          "comment",
                          comment.id,
                          comment.isVisible ? "hide" : "restore",
                        )
                      }
                      className="h-7 gap-1"
                    >
                      {busyId === `comment:${comment.id}` ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : comment.isVisible ? (
                        <ImageOff className="h-3.5 w-3.5" />
                      ) : (
                        <Eye className="h-3.5 w-3.5" />
                      )}
                      {comment.isVisible ? "Hide" : "Restore"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
