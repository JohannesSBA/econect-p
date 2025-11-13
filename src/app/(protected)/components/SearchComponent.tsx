"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type MouseEvent as ReactMouseEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  Briefcase,
  Building,
  FileText,
  Heart,
  MapPin,
  MessageCircle,
  Search,
  Users,
  X,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";

interface SearchResult {
  people: Array<{
    id: string;
    name: string;
    email: string;
    headline?: string;
    location?: string;
    image?: string;
    role: string;
  }>;
  jobs: Array<{
    id: string;
    title: string;
    company: string;
    location: string;
    salary?: string;
    jobType: string;
    hasApplied: boolean;
    employer: {
      id: string;
      name: string;
      image?: string;
    };
  }>;
  posts: Array<{
    id: string;
    content: string;
    createdAt: string;
    isLiked: boolean;
    likeCount: number;
    commentCount: number;
    author: {
      id: string;
      name: string;
      image?: string;
      headline?: string;
    };
  }>;
  totalResults: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const searchTabs: Array<{
  key: "all" | "people" | "jobs" | "posts";
  label: string;
  icon: ComponentType<{ className?: string }>;
}> = [
  { key: "all", label: "All", icon: Search },
  { key: "people", label: "People", icon: Users },
  { key: "jobs", label: "Jobs", icon: Briefcase },
  { key: "posts", label: "Posts", icon: FileText },
];

export default function SearchComponent() {
  const router = useRouter();

  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<
    "all" | "people" | "jobs" | "posts"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = useCallback(
    async (page: number) => {
      if (!query.trim()) return;

      setIsLoading(true);
      try {
        const response = await axios.get(
          `/api/search?q=${encodeURIComponent(query)}&type=${searchType}&page=${page}&limit=5`,
        );
        setResults(response.data as SearchResult);
        setShowResults(true);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [query, searchType],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (query.trim().length >= 2) {
        setCurrentPage(1);
        void performSearch(1);
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query, searchType, performSearch]);

  useEffect(() => {
    if (query.trim().length >= 2 && currentPage !== 1) {
      void performSearch(currentPage);
    }
  }, [currentPage, performSearch, query]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResultClick = (
    type: "people" | "company" | "jobs" | "posts",
    id: string,
  ) => {
    setShowResults(false);
    setQuery("");
    setCurrentPage(1);

    switch (type) {
      case "people":
        router.push(`/user/${id}`);
        break;
      case "company":
        router.push(`/company/${id}`);
        break;
      case "jobs":
        router.push(`/jobs/${id}`);
        break;
      case "posts":
        router.push(`/dashboard?post=${id}`);
        break;
    }
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .map((segment) => segment[0])
      .join("")
      .toUpperCase();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
  };

  const handleTabClick = (
    event: ReactMouseEvent<HTMLButtonElement>,
    key: "all" | "people" | "jobs" | "posts",
  ) => {
    event.preventDefault();
    setSearchType(key);
  };

  const hasPeopleResults =
    results &&
    results.people &&
    results.people.length > 0 &&
    (searchType === "all" || searchType === "people");
  const hasJobResults =
    results &&
    results.jobs &&
    results.jobs.length > 0 &&
    (searchType === "all" || searchType === "jobs");
  const hasPostResults =
    results &&
    results.posts &&
    results.posts.length > 0 &&
    (searchType === "all" || searchType === "posts");

  return (
    <div ref={searchRef} className="relative z-[60] w-full min-w-0">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          placeholder="Search people, jobs, posts..."
          className="w-full rounded-full border border-slate-200 bg-slate-100 pl-10 pr-9 text-sm transition focus:border-blue-200 focus:bg-white focus:ring-2 focus:ring-blue-500/40"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => {
              setQuery("");
              setResults(null);
              setShowResults(false);
              setCurrentPage(1);
            }}
            className="absolute right-1.5 h-7 w-7 rounded-full text-slate-500 hover:bg-slate-200"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute left-0 right-0 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl drop-shadow-lg sm:max-w-xl">
          <div className="flex flex-wrap gap-1 border-b border-slate-100 bg-slate-50/80 p-2">
            {searchTabs.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={(event) => handleTabClick(event, key)}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 ${
                  searchType === key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="max-h-[26rem] overflow-y-auto p-3">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 py-6 text-xs text-slate-500">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-transparent" />
                Searching...
              </div>
            ) : results && results.totalResults > 0 ? (
              <div className="space-y-6">
                {hasPeopleResults && (
                  <section>
                    <header className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>People</span>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0 text-[10px]"
                      >
                        {results.people.length}
                      </Badge>
                    </header>
                    <ul className="space-y-2">
                      {results.people.map((person) => (
                        <li key={person.id}>
                          <button
                            type="button"
                            onClick={() =>
                              handleResultClick(
                                person.role === "EMPLOYER"
                                  ? "company"
                                  : "people",
                                person.id,
                              )
                            }
                            className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-white px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={person.image || undefined} />
                              <AvatarFallback>
                                {getInitials(person.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                                  {person.name}
                                </p>
                                <Badge
                                  variant="secondary"
                                  className="rounded-full bg-slate-100 text-[11px]"
                                >
                                  {person.role}
                                </Badge>
                              </div>
                              {person.headline && (
                                <p className="text-xs text-slate-600 line-clamp-1">
                                  {person.headline}
                                </p>
                              )}
                              {person.location && (
                                <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
                                  <MapPin className="h-3 w-3" />
                                  <span className="line-clamp-1">
                                    {person.location}
                                  </span>
                                </div>
                              )}
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {hasJobResults && (
                  <section>
                    <header className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Jobs</span>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0 text-[10px]"
                      >
                        {results.jobs.length}
                      </Badge>
                    </header>
                    <ul className="space-y-2">
                      {results.jobs.map((job) => (
                        <li key={job.id}>
                          <button
                            type="button"
                            onClick={() => handleResultClick("jobs", job.id)}
                            className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-white px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
                          >
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-slate-900 line-clamp-1">
                                  {job.title}
                                </p>
                                {job.hasApplied && (
                                  <Badge
                                    variant="outline"
                                    className="rounded-full border-green-500 bg-green-50 text-[11px] text-green-600"
                                  >
                                    Applied
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 line-clamp-1">
                                {job.company}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {job.location}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className="rounded-full bg-slate-100 text-[11px]"
                                >
                                  {job.jobType}
                                </Badge>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {hasPostResults && (
                  <section>
                    <header className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <span>Posts</span>
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0 text-[10px]"
                      >
                        {results.posts.length}
                      </Badge>
                    </header>
                    <ul className="space-y-2">
                      {results.posts.map((post) => (
                        <li key={post.id}>
                          <button
                            type="button"
                            onClick={() => handleResultClick("posts", post.id)}
                            className="flex w-full items-start gap-3 rounded-xl border border-transparent bg-white px-3 py-2 text-left transition hover:border-blue-200 hover:bg-blue-50/60"
                          >
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={post.author.image || undefined}
                              />
                              <AvatarFallback>
                                {getInitials(post.author.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span className="font-medium text-slate-900">
                                  {post.author.name}
                                </span>
                                <span>•</span>
                                <span>{formatDate(post.createdAt)}</span>
                              </div>
                              <p className="mt-1 text-sm text-slate-700 line-clamp-2">
                                {truncateText(post.content, 120)}
                              </p>
                              <div className="mt-2 flex items-center gap-4 text-[11px] text-slate-500">
                                <span className="flex items-center gap-1">
                                  <Heart
                                    className={`h-3.5 w-3.5 ${
                                      post.isLiked
                                        ? "fill-red-500 text-red-500"
                                        : "text-slate-400"
                                    }`}
                                  />
                                  {post.likeCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MessageCircle className="h-3.5 w-3.5 text-slate-400" />
                                  {post.commentCount}
                                </span>
                              </div>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {results && results.pagination.totalPages > 1 && (
                  <div className="border-t border-slate-100 pt-4">
                    <Pagination
                      currentPage={results.pagination.page}
                      totalPages={results.pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="py-6 text-center text-sm text-slate-500">
                <p>No results found for “{query}”.</p>
                <p className="mt-1 text-xs text-slate-400">
                  Try different keywords or switch tabs.
                </p>
              </div>
            ) : null}
          </div>

          {results && results.totalResults > 0 && (
            <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-2 text-right">
              <Link
                href={`/search?q=${encodeURIComponent(query)}&type=${searchType}`}
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700"
              >
                View all {results.totalResults} results →
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
