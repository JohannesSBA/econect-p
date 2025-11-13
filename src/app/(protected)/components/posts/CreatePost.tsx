"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter as DialogFooterPrimitive,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Toast, useToast } from "@/components/ui/toast";
import {
  ImageIcon,
  Link as LinkIcon,
  Video,
  Calendar,
  Send,
  Smile,
  Pencil,
  X,
  Loader2,
  MapPin,
  Clock3,
} from "lucide-react";
import { User } from "@/../types/prisma";
import { getAvatarUrl } from "@/lib/image-utils";
import { socketManager } from "@/lib/socket";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 3;
const EMOJI_OPTIONS = [
  "😀",
  "😂",
  "😍",
  "🤔",
  "🎉",
  "🔥",
  "❤️",
  "👏",
  "🙌",
  "🚀",
  "😊",
  "😎",
];

type LinkMode = "link" | "video";

type EventDetails = {
  title: string;
  date: string;
  time: string;
  location: string;
};

type CreatePostResponse = {
  post?: {
    id: string;
    [key: string]: unknown;
  };
  error?: string;
};

interface CreatePostProps {
  user: User & {
    headline?: string | null;
  };
}

function hasEventDetails(details: EventDetails) {
  return Boolean(
    details.title || details.date || details.time || details.location,
  );
}

function buildEventSummary(details: EventDetails) {
  if (!hasEventDetails(details)) return "";
  const lines = ["Event Details:"];
  if (details.title) lines.push(`Title: ${details.title}`);
  if (details.date) lines.push(`Date: ${details.date}`);
  if (details.time) lines.push(`Time: ${details.time}`);
  if (details.location) lines.push(`Location: ${details.location}`);
  return lines.join("\n");
}

function normalizeUrl(value: string) {
  if (!value) return null;
  let candidate = value.trim();
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    const parsed = new URL(candidate);
    return parsed.toString();
  } catch {
    return null;
  }
}

export function CreatePost({ user }: CreatePostProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkMode, setLinkMode] = useState<LinkMode>("link");
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkInput, setLinkInput] = useState("");
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventDetails, setEventDetails] = useState<EventDetails>({
    title: "",
    date: "",
    time: "",
    location: "",
  });
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [visibility, setVisibility] = useState<
    "PUBLIC" | "PRIVATE" | "UNLISTED"
  >("PUBLIC");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPanelRef = useRef<HTMLDivElement>(null);
  const emojiTriggerRef = useRef<HTMLButtonElement>(null);

  const { toasts, showToast, removeToast } = useToast();

  const roleLabel = useMemo(
    () =>
      user.role
        .split("_")
        .map((segment) => segment.charAt(0) + segment.slice(1).toLowerCase())
        .join(" "),
    [user.role],
  );
  const profileTag = user.headline || roleLabel;

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPanelRef.current?.contains(target) ||
        emojiTriggerRef.current?.contains(target)
      ) {
        return;
      }
      setEmojiPickerOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [emojiPickerOpen]);

  const eventSummary = useMemo(
    () => buildEventSummary(eventDetails),
    [eventDetails],
  );

  const resetForm = () => {
    setTitle("");
    setContent("");
    setImages([]);
    setIsExpanded(false);
    setLinkUrl("");
    setVideoUrl("");
    setLinkInput("");
    setLinkMode("link");
    setShowEventForm(false);
    setEventDetails({ title: "", date: "", time: "", location: "" });
    setEmojiPickerOpen(false);
    setVisibility("PUBLIC");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let baseContent = content.trim();
    if (!baseContent) {
      if (images.length > 0) baseContent = "Shared a photo";
      else if (videoUrl) baseContent = "Shared a video";
      else if (linkUrl) baseContent = "Shared a link";
    }

    const finalContent = [baseContent, eventSummary]
      .filter(Boolean)
      .join(baseContent && eventSummary ? "\n\n" : "")
      .trim();

    if (!finalContent) {
      showToast(
        "Add a message, media, link, or event details before posting.",
        "error",
      );
      return;
    }

    const payloadType =
      images.length > 0 ? "IMAGE" : linkUrl || videoUrl ? "LINK" : "TEXT";

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim() || undefined,
          content: finalContent,
          type: payloadType,
          images,
          linkUrl: linkUrl || undefined,
          videoUrl: videoUrl || undefined,
          eventDate: eventDetails.date
            ? new Date(eventDetails.date).toISOString()
            : undefined,
          eventTime: eventDetails.time || undefined,
          visibility,
        }),
      });

      if (!response.ok) {
        const errorBody: CreatePostResponse = await response
          .json()
          .catch(() => ({}) as CreatePostResponse);
        showToast(errorBody.error || "Unable to create your post.", "error");
        return;
      }

      const body: CreatePostResponse = await response
        .json()
        .catch(() => ({}) as CreatePostResponse);
      const created = body.post;
      resetForm();
      showToast("Your post is live!", "success");
      try {
        if (created) socketManager.emit("new_post", { post: created });
      } catch {}
    } catch (error) {
      console.error("Error creating post:", error);
      showToast("Something went wrong while creating the post.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePickImages = () => {
    if (images.length >= MAX_IMAGES) {
      showToast("You can attach up to 3 images per post.", "info");
      return;
    }
    fileInputRef.current?.click();
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
    showToast("Removed image from post.", "info");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (images.length >= MAX_IMAGES) {
      showToast("You already have the maximum number of images.", "info");
      return;
    }

    const remainingSlots = MAX_IMAGES - images.length;
    const toUpload = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      showToast(
        `Only ${remainingSlots} more image${remainingSlots > 1 ? "s" : ""} can be added.`,
        "info",
      );
    }

    let skippedType = false;
    let skippedSize = false;

    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of toUpload) {
        if (!file.type.startsWith("image/")) {
          skippedType = true;
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          skippedSize = true;
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "post-image");
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        if (data?.fileUrl) uploadedUrls.push(data.fileUrl);
      }
      if (uploadedUrls.length > 0) {
        setImages((prev) => [...prev, ...uploadedUrls].slice(0, MAX_IMAGES));
        showToast(
          `Added ${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""}.`,
          "success",
        );
      }
      if (skippedType) {
        showToast("Only image files can be attached.", "info");
      }
      if (skippedSize) {
        showToast("Each image must be under 5MB.", "info");
      }
    } catch (err) {
      console.error("Failed uploading images", err);
      showToast("We couldn't upload one of your images.", "error");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openLinkDialog = (mode: LinkMode) => {
    setLinkMode(mode);
    setLinkInput(mode === "video" ? videoUrl : linkUrl);
    setLinkDialogOpen(true);
  };

  const handleConfirmLink = () => {
    const normalized = normalizeUrl(linkInput);
    if (!normalized) {
      showToast("Enter a valid URL, including the domain.", "error");
      return;
    }
    if (linkMode === "video") setVideoUrl(normalized);
    else setLinkUrl(normalized);
    setIsExpanded(true);
    setLinkDialogOpen(false);
    showToast(
      `${linkMode === "video" ? "Video" : "Link"} attached to your post.`,
      "success",
    );
  };

  const handleRemoveLink = () => {
    setLinkUrl("");
    showToast("Removed the attached link.", "info");
  };

  const handleRemoveVideo = () => {
    setVideoUrl("");
    showToast("Removed the attached video link.", "info");
  };

  const handleToggleEvent = () => {
    setShowEventForm((prev) => !prev);
    if (showEventForm) {
      setEventDetails({ title: "", date: "", time: "", location: "" });
    } else {
      setIsExpanded(true);
    }
  };

  const isPostDisabled =
    isSubmitting ||
    isUploading ||
    (!content.trim() &&
      !linkUrl &&
      !videoUrl &&
      images.length === 0 &&
      !hasEventDetails(eventDetails));

  return (
    <>
      <form onSubmit={handleSubmit} className="w-full">
        <Card className="bg-white shadow-sm border border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Create a post
              </CardTitle>
              <p className="text-xs text-slate-500">
                Share updates, resources, or start a conversation with your
                network.
              </p>
            </div>
            <Pencil className="h-4 w-4 text-slate-400" aria-hidden />
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
              <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={getAvatarUrl(user.image, user.name)} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>

              <div className="mt-3 sm:mt-0 flex-1 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900 text-sm sm:text-base">
                    {user.name}
                  </span>
                  {profileTag && (
                    <Badge variant="secondary" className="text-xs">
                      {profileTag}
                    </Badge>
                  )}
                  <div className="flex items-center gap-2">
                    <Select
                      value={visibility}
                      onValueChange={(v: "PUBLIC" | "PRIVATE" | "UNLISTED") =>
                        setVisibility(v)
                      }
                    >
                      <SelectTrigger className="h-7 w-[130px] text-xs">
                        <SelectValue placeholder="Visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                        <SelectItem value="PRIVATE">Private</SelectItem>
                        <SelectItem value="UNLISTED">Unlisted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  placeholder="What do you want to talk about?"
                  value={content}
                  onFocus={() => setIsExpanded(true)}
                  onChange={(e) => setContent(e.target.value)}
                  className={cn(
                    "min-h-[72px] resize-none bg-white/90 text-sm leading-5 text-slate-900",
                    "focus-visible:border-blue-500 focus-visible:ring-blue-500/40",
                  )}
                  rows={isExpanded ? 4 : 3}
                />

                {isExpanded && (
                  <div className="space-y-3">
                    <Input
                      type="text"
                      placeholder="Add a title (optional)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      maxLength={120}
                      className="border-slate-200"
                    />

                    {images.length > 0 && (
                      <div className="grid gap-3 sm:grid-cols-3">
                        {images.map((url, idx) => (
                          <div
                            key={url}
                            className="group relative overflow-hidden rounded-lg border border-slate-200"
                          >
                            <img
                              src={url}
                              alt={`upload-${idx + 1}`}
                              className="h-32 w-full object-cover transition group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveImage(idx)}
                              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                              aria-label="Remove image"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {(linkUrl || videoUrl) && (
                      <div className="flex flex-col gap-2">
                        {linkUrl && (
                          <div className="flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                            <div className="flex items-center gap-2 overflow-hidden min-w-0 max-w-full">
                              <LinkIcon
                                className="h-4 w-4 flex-shrink-0"
                                aria-hidden
                              />
                              <a
                                href={linkUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all underline decoration-blue-400 hover:text-blue-800"
                              >
                                {linkUrl}
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveLink}
                              className="text-xs text-blue-700 hover:text-blue-900"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                        {videoUrl && (
                          <div className="flex items-center justify-between rounded-lg border border-purple-100 bg-purple-50 px-3 py-2 text-sm text-purple-700">
                            <div className="flex items-center gap-2 overflow-hidden min-w-0 max-w-full">
                              <Video
                                className="h-4 w-4 flex-shrink-0"
                                aria-hidden
                              />
                              <a
                                href={videoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all underline decoration-purple-400 hover:text-purple-800"
                              >
                                {videoUrl}
                              </a>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveVideo}
                              className="text-xs text-purple-700 hover:text-purple-900"
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {showEventForm && (
                      <div className="space-y-3 rounded-lg border border-emerald-100 bg-emerald-50/80 p-3 text-sm">
                        <div className="flex items-center gap-2 text-emerald-800">
                          <Calendar className="h-4 w-4" aria-hidden />
                          <span className="font-semibold">
                            Add event details
                          </span>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <Input
                            placeholder="Event title"
                            value={eventDetails.title}
                            onChange={(e) =>
                              setEventDetails((prev) => ({
                                ...prev,
                                title: e.target.value,
                              }))
                            }
                          />
                          <Input
                            type="date"
                            placeholder="Date"
                            value={eventDetails.date}
                            onChange={(e) =>
                              setEventDetails((prev) => ({
                                ...prev,
                                date: e.target.value,
                              }))
                            }
                          />
                          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
                            <div className="flex items-center gap-2">
                              <Clock3
                                className="h-4 w-4 text-emerald-600"
                                aria-hidden
                              />
                              <Input
                                type="time"
                                value={eventDetails.time}
                                onChange={(e) =>
                                  setEventDetails((prev) => ({
                                    ...prev,
                                    time: e.target.value,
                                  }))
                                }
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin
                                className="h-4 w-4 text-emerald-600"
                                aria-hidden
                              />
                              <Input
                                placeholder="Location or meeting link"
                                value={eventDetails.location}
                                onChange={(e) =>
                                  setEventDetails((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                        {eventSummary && (
                          <div className="rounded-md bg-white/70 p-3 text-xs text-emerald-700">
                            <pre className="whitespace-pre-wrap font-sans">
                              {eventSummary}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500">
                  <span>{content.length} characters</span>
                  {images.length > 0 && (
                    <span>{MAX_IMAGES - images.length} image slots left</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600"
                onClick={handlePickImages}
                disabled={isUploading || images.length >= MAX_IMAGES}
              >
                {isUploading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="mr-1 h-4 w-4" />
                )}
                Media
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFilesSelected}
                className="hidden"
              />

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600"
                onClick={() => openLinkDialog("link")}
              >
                <LinkIcon className="mr-1 h-4 w-4" />
                Link
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-blue-600"
                onClick={() => openLinkDialog("video")}
              >
                <Video className="mr-1 h-4 w-4" />
                Video
              </Button>

              <Button
                type="button"
                variant={showEventForm ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "text-slate-600 hover:text-blue-600",
                  showEventForm &&
                    "bg-emerald-600 text-white hover:bg-emerald-700",
                )}
                onClick={handleToggleEvent}
              >
                <Calendar className="mr-1 h-4 w-4" />
                Event
              </Button>

              <div className="relative">
                <Button
                  type="button"
                  variant={emojiPickerOpen ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "text-slate-600 hover:text-blue-600",
                    emojiPickerOpen &&
                      "bg-amber-500 text-white hover:bg-amber-600",
                  )}
                  ref={emojiTriggerRef}
                  onClick={() => setEmojiPickerOpen((prev) => !prev)}
                >
                  <Smile className="mr-1 h-4 w-4" />
                  Emoji
                </Button>

                {emojiPickerOpen && (
                  <div
                    ref={emojiPanelRef}
                    className="absolute z-10 mt-2 flex w-48 flex-wrap gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setContent((prev) => `${prev}${emoji}`);
                          setIsExpanded(true);
                          setEmojiPickerOpen(false);
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-lg hover:border-slate-300"
                        aria-label={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Button
                type="button"
                variant="ghost"
                className="text-slate-500 hover:text-slate-700"
                onClick={resetForm}
                disabled={isSubmitting || isUploading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                className="bg-blue-600 text-white hover:bg-blue-700"
                disabled={isPostDisabled}
              >
                {isSubmitting || isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isUploading
                  ? "Uploading..."
                  : isSubmitting
                    ? "Posting..."
                    : "Post"}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>
              {linkMode === "video" ? "Attach a video link" : "Attach a link"}
            </DialogTitle>
            <DialogDescription>
              Paste a full URL. We will include it with your post so others can
              open it easily.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="https://example.com"
              value={linkInput}
              onChange={(e) => setLinkInput(e.target.value)}
            />
            <p className="text-xs text-slate-500">
              Links are shared as-is. Ensure they are accessible to everyone.
            </p>
          </div>
          <DialogFooterPrimitive className="mt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setLinkDialogOpen(false);
                setLinkInput(linkMode === "video" ? videoUrl : linkUrl);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirmLink}>
              {linkMode === "video" ? "Save video" : "Save link"}
            </Button>
          </DialogFooterPrimitive>
        </DialogContent>
      </Dialog>

      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </>
  );
}
