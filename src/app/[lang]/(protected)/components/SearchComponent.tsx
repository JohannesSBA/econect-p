"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, Users, Briefcase, FileText, X, MapPin, Building, Heart, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Pagination } from '@/components/ui/pagination';
import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

export default function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'people' | 'jobs' | 'posts'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search function with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim().length >= 2) {
        setCurrentPage(1); // Reset to first page for new searches
        performSearch();
      } else {
        setResults(null);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchType]);

  // Handle page changes
  useEffect(() => {
    if (query.trim().length >= 2 && currentPage > 1) {
      performSearch();
    }
  }, [currentPage]);

  const performSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&type=${searchType}&page=${currentPage}&limit=5`);
      setResults(response.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleResultClick = (type: string, id: string) => {
    setShowResults(false);
    setQuery('');
    setCurrentPage(1);
    
    switch (type) {
      case 'people':
        router.push(`/profile/${id}`);
        break;
      case 'jobs':
        router.push(`/jobs/${id}`);
        break;
      case 'posts':
        router.push(`/dashboard?post=${id}`);
        break;
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div ref={searchRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search people, jobs, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setShowResults(true)}
          className="pl-10 w-64 bg-gray-100 border-0 focus:bg-white focus:ring-2 focus:ring-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setResults(null);
              setShowResults(false);
              setCurrentPage(1);
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Type Filter */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 mt-1">
          <div className="flex border-b border-gray-100">
            {[
              { key: 'all', label: 'All', icon: Search },
              { key: 'people', label: 'People', icon: Users },
              { key: 'jobs', label: 'Jobs', icon: Briefcase },
              { key: 'posts', label: 'Posts', icon: FileText },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSearchType(key as 'all' | 'people' | 'jobs' | 'posts')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium ${
                  searchType === key
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2">Searching...</p>
              </div>
            ) : results && results.totalResults > 0 ? (
              <div>
                {/* People Results */}
                {results.people.length > 0 && (searchType === 'all' || searchType === 'people') && (
                  <div className="border-b border-gray-100">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      People ({results.people.length})
                    </div>
                    {results.people.map((person) => (
                      <div
                        key={person.id}
                        onClick={() => handleResultClick('people', person.id)}
                        className="flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={person.image || undefined} />
                          <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{person.name}</p>
                            <Badge variant="secondary" className="text-xs">
                              {person.role}
                            </Badge>
                          </div>
                          {person.headline && (
                            <p className="text-xs text-gray-600 truncate">{person.headline}</p>
                          )}
                          {person.location && (
                            <div className="flex items-center space-x-1 mt-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{person.location}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Jobs Results */}
                {results.jobs.length > 0 && (searchType === 'all' || searchType === 'jobs') && (
                  <div className="border-b border-gray-100">
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Jobs ({results.jobs.length})
                    </div>
                    {results.jobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => handleResultClick('jobs', job.id)}
                        className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Building className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                            {job.hasApplied && (
                              <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                Applied
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 truncate">{job.company}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3 text-gray-400" />
                              <p className="text-xs text-gray-500">{job.location}</p>
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {job.jobType}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Posts Results */}
                {results.posts.length > 0 && (searchType === 'all' || searchType === 'posts') && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Posts ({results.posts.length})
                    </div>
                    {results.posts.map((post) => (
                      <div
                        key={post.id}
                        onClick={() => handleResultClick('posts', post.id)}
                        className="flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={post.author.image || undefined} />
                          <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">{post.author.name}</p>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500">{formatDate(post.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                            {truncateText(post.content, 100)}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <div className="flex items-center space-x-1">
                              <Heart className={`h-3 w-3 ${post.isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                              <span className="text-xs text-gray-500">{post.likeCount}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MessageCircle className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{post.commentCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {results.pagination.totalPages > 1 && (
                  <div className="border-t border-gray-100 px-4 py-3">
                    <Pagination
                      currentPage={results.pagination.page}
                      totalPages={results.pagination.totalPages}
                      onPageChange={handlePageChange}
                      className="text-sm"
                    />
                  </div>
                )}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="p-4 text-center text-gray-500">
                <p>No results found for &quot;{query}&quot;</p>
                <p className="text-xs mt-1">Try different keywords or search type</p>
              </div>
            ) : null}
          </div>

          {/* View All Results */}
          {results && results.totalResults > 0 && (
            <div className="border-t border-gray-100 px-4 py-2">
              <Link
                href={`search?q=${encodeURIComponent(query)}&type=${searchType}`}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
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