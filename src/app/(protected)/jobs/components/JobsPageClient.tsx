"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  MapPin,
  Clock,
  DollarSign,
  Bookmark,
  Share2,
  Eye,
  Filter,
  X,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Toast, useToast } from "@/components/ui/toast";
import { getCompanyLogoUrl } from "@/lib/image-utils";

interface JobListing {
  id: string;
  title: string;
  description: string;
  company: string;
  location: string;
  tags: string[];
  salary?: string;
  jobType: string;
  status: string;
  createdAt: string;
  employer: {
    id: string;
    name: string;
    image?: string;
  };
  applications: { id: string }[];
  bookmarks: { id: string }[];
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface JobsPageClientProps {
  user: User;
  initialJobs: JobListing[];
}

export default function JobsPageClient({
  user,
  initialJobs,
}: JobsPageClientProps) {
  const [jobs, setJobs] = useState<JobListing[]>(initialJobs);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>(initialJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    jobType: [] as string[],
    experienceLevel: [] as string[],
    location: [] as string[],
    salaryRange: [] as string[],
  });
  const { toasts, showToast, removeToast } = useToast();

  // Get unique values for filters
  const locations = [...new Set(jobs.map((job) => job.location))];
  const jobTypes = [...new Set(jobs.map((job) => job.jobType))];

  // Apply filters and search
  useEffect(() => {
    let filtered = jobs;

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(
        (job) =>
          job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.employer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          job.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Apply filters
    if (filters.jobType.length > 0) {
      filtered = filtered.filter((job) =>
        filters.jobType.includes(job.jobType),
      );
    }

    if (filters.location.length > 0) {
      filtered = filtered.filter((job) =>
        filters.location.includes(job.location),
      );
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, filters]);

  // Handle filter changes
  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string,
  ) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter((item) => item !== value)
        : [...prev[filterType], value],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      jobType: [],
      experienceLevel: [],
      location: [],
      salaryRange: [],
    });
    setSearchTerm("");
  };

  // Handle bookmark toggle
  const handleBookmarkToggle = async (jobId: string) => {
    try {
      const job = jobs.find((job) => job.id === jobId);
      if (!job) return;

      const isBookmarked = job.bookmarks.length > 0;

      const response = await fetch(
        isBookmarked
          ? `/api/jobs/bookmark?jobId=${jobId}`
          : "/api/jobs/bookmark",
        {
          method: isBookmarked ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: isBookmarked ? undefined : JSON.stringify({ jobId }),
        },
      );

      if (response.ok) {
        // Update local state
        setJobs((prev) =>
          prev.map((job) => {
            if (job.id === jobId) {
              return {
                ...job,
                bookmarks: isBookmarked ? [] : [{ id: "temp" }],
              };
            }
            return job;
          }),
        );

        showToast(
          isBookmarked
            ? "Job removed from bookmarks"
            : "Job added to bookmarks",
          "success",
        );
      } else {
        showToast("Failed to update bookmark", "error");
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      showToast("Failed to update bookmark", "error");
    }
  };

  // Handle share
  const handleShare = async (job: JobListing) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job.title,
          text: `${job.title} at ${job.employer.name}`,
          url: `${window.location.origin}/jobs/${job.id}`,
        });
        showToast("Job shared successfully", "success");
      } catch (error) {
        console.error("Error sharing:", error);
        showToast("Failed to share job", "error");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        const url = `${window.location.origin}/jobs/${job.id}`;
        await navigator.clipboard.writeText(url);
        showToast("Job link copied to clipboard", "success");
      } catch (error) {
        console.error("Error copying link:", error);
        showToast("Failed to copy link", "error");
      }
    }
  };

  const activeFiltersCount =
    Object.values(filters).flat().length + (searchTerm ? 1 : 0);

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card className="bg-white shadow-sm sticky top-20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">
                    Filters
                  </CardTitle>
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Job Type Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Job Type</h4>
                  <div className="space-y-2">
                    {jobTypes.map((type) => (
                      <label key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={filters.jobType.includes(type)}
                          onChange={() => handleFilterChange("jobType", type)}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                          {type.replace("_", " ")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Experience Level Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Experience Level
                  </h4>
                  <div className="space-y-2">
                    {["Entry Level", "Mid Level", "Senior", "Executive"].map(
                      (level) => (
                        <label
                          key={level}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={filters.experienceLevel.includes(level)}
                            onChange={() =>
                              handleFilterChange("experienceLevel", level)
                            }
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{level}</span>
                        </label>
                      ),
                    )}
                  </div>
                </div>

                <Separator />

                {/* Location Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Location</h4>
                  <div className="space-y-2">
                    {locations.map((location) => (
                      <label
                        key={location}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={filters.location.includes(location)}
                          onChange={() =>
                            handleFilterChange("location", location)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">
                          {location}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Salary Range Filter */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Salary Range
                  </h4>
                  <div className="space-y-2">
                    {[
                      "$0 - $50k",
                      "$50k - $100k",
                      "$100k - $150k",
                      "$150k+",
                    ].map((range) => (
                      <label
                        key={range}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={filters.salaryRange.includes(range)}
                          onChange={() =>
                            handleFilterChange("salaryRange", range)
                          }
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{range}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Search and Actions */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search jobs, companies, or keywords..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 border-gray-200"
                    />
                  </div>
                  {(user.role === "EMPLOYER" ||
                    user.role === "RECRUITER" ||
                    user.role === "ADMIN") && (
                    <Link href={`/jobs/create`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Post Job
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <div className="flex items-center justify-between">
              <p className="text-gray-600">
                {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""}{" "}
                found
              </p>
              {activeFiltersCount > 0 && (
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {activeFiltersCount} filter
                    {activeFiltersCount !== 1 ? "s" : ""} active
                  </span>
                </div>
              )}
            </div>

            {/* Job Listings */}
            <div className="space-y-4">
              {filteredJobs.map((job) => (
                <Card
                  key={job.id}
                  className="bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={getCompanyLogoUrl(
                            job.employer.image,
                            job.employer.name,
                          )}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                          {job.employer.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <Link href={`/jobs/${job.id}`}>
                              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer">
                                {job.title}
                              </h3>
                            </Link>
                            <Link href={`/company/${job.employer.id}`}>
                              <p className="text-blue-600 font-medium hover:underline cursor-pointer">
                                {job.employer.name}
                              </p>
                            </Link>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleBookmarkToggle(job.id)}
                            className={`${job.bookmarks.length > 0 ? "text-blue-600" : "text-gray-500"} hover:text-blue-600`}
                          >
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-4 w-4" />
                            <span>{job.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{job.jobType.replace("_", " ")}</span>
                          </div>
                          {job.salary && (
                            <div className="flex items-center space-x-1">
                              <DollarSign className="h-4 w-4" />
                              <span>{job.salary}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-gray-700 mt-3 line-clamp-2">
                          {job.description}
                        </p>

                        <div className="flex items-center justify-between mt-4">
                          <div className="flex flex-wrap gap-2">
                            {job.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{job.applications.length} applicants</span>
                            <span>•</span>
                            <span>
                              {new Date(job.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mt-4 pt-4 border-t border-gray-100">
                          <Link href={`/en/jobs/${job.id}`}>
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              View Details
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleShare(job)}
                          >
                            <Share2 className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredJobs.length === 0 && (
                <Card className="bg-white shadow-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-500">
                      <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium mb-2">
                        No jobs found
                      </h3>
                      <p className="text-gray-400">
                        Try adjusting your search terms or filters to find more
                        opportunities.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Load More */}
            {filteredJobs.length > 0 && (
              <div className="text-center">
                <Button variant="outline" size="lg">
                  Load more jobs
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Toast notifications */}
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
