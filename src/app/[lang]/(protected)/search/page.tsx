"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Users, Briefcase, FileText, MapPin, Building, Heart, MessageCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination } from '@/components/ui/pagination';
import axios from 'axios';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import Header from '../components/Header';

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

export default function SearchPage({ params }: { params: Promise<{ lang: 'en' | 'am' }> }) {
  const [lang, setLang] = useState<'en' | 'am'>('en');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'people' | 'jobs' | 'posts'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    const initPage = async () => {
      const { lang: language } = await params;
      setLang(language);
      
      const query = searchParams.get('q') || '';
      const type = (searchParams.get('type') as 'all' | 'people' | 'jobs' | 'posts') || 'all';
      const page = parseInt(searchParams.get('page') || '1');
      
      setSearchQuery(query);
      setSearchType(type);
      setActiveTab(type);
      setCurrentPage(page);
      
      if (query) {
        performSearch(query, type, page);
      }
    };
    
    initPage();
  }, [params, searchParams]);

  const performSearch = async (query: string, type: string, page: number = 1) => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`/api/search?q=${encodeURIComponent(query)}&type=${type}&page=${page}&limit=20`);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setCurrentPage(1);
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&page=1`);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchType(value as 'all' | 'people' | 'jobs' | 'posts');
    setCurrentPage(1);
    if (searchQuery.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery)}&type=${value}&page=1`);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (searchQuery.trim()) {
      router.push(`/${lang}/search?q=${encodeURIComponent(searchQuery)}&type=${searchType}&page=${page}`);
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

  // Show loading while session is loading
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (status === 'unauthenticated' || !session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please log in to access search functionality.</p>
          <Link href={`/${lang}/auth/login`}>
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Create a user object from session data
  const user = {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image || '',
    headline: '',
    role: 'USER'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header lang={lang} user={user} />
      
      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search Results</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search people, jobs, posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 h-12 text-lg"
              />
              <Button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8">
                Search
              </Button>
            </div>
          </form>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : results ? (
          <div>
            {/* Results Summary */}
            <div className="mb-6">
              <p className="text-gray-600">
                Found {results.totalResults} results for &quot;{searchQuery}&quot;
                {results.pagination.totalPages > 1 && (
                  <span className="ml-2 text-sm text-gray-500">
                    (Page {results.pagination.page} of {results.pagination.totalPages})
                  </span>
                )}
              </p>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center space-x-2">
                  <Search className="h-4 w-4" />
                  <span>All ({results.totalResults})</span>
                </TabsTrigger>
                <TabsTrigger value="people" className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>People ({results.pagination.totalPages > 1 ? 'Many' : results.people.length})</span>
                </TabsTrigger>
                <TabsTrigger value="jobs" className="flex items-center space-x-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Jobs ({results.pagination.totalPages > 1 ? 'Many' : results.jobs.length})</span>
                </TabsTrigger>
                <TabsTrigger value="posts" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Posts ({results.pagination.totalPages > 1 ? 'Many' : results.posts.length})</span>
                </TabsTrigger>
              </TabsList>

              {/* All Results */}
              <TabsContent value="all" className="space-y-6">
                {/* People Section */}
                {results.people.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Users className="h-5 w-5" />
                        <span>People ({results.people.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {results.people.map((person) => (
                          <Link key={person.id} href={`/${lang}/${person.role === 'EMPLOYER' ? 'company' : 'user'}/${person.id}`}>
                            <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={person.image || undefined} />
                                <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
                                  <Badge variant="secondary" className="text-xs">{person.role}</Badge>
                                </div>
                                {person.headline && (
                                  <p className="text-sm text-gray-600 truncate mt-1">{person.headline}</p>
                                )}
                                {person.location && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <MapPin className="h-3 w-3 text-gray-400" />
                                    <p className="text-xs text-gray-500">{person.location}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Jobs Section */}
                {results.jobs.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <Briefcase className="h-5 w-5" />
                        <span>Jobs ({results.jobs.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {results.jobs.map((job) => (
                          <Link key={job.id} href={`/${lang}/jobs/${job.id}`}>
                            <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Building className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                                  {job.hasApplied && (
                                    <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                      Applied
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 truncate mt-1">{job.company}</p>
                                <div className="flex items-center space-x-3 mt-2">
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
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Posts Section */}
                {results.posts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center space-x-2 text-lg">
                        <FileText className="h-5 w-5" />
                        <span>Posts ({results.posts.length})</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid gap-3">
                        {results.posts.map((post) => (
                          <Link key={post.id} href={`/${lang}/dashboard?post=${post.id}`}>
                            <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-start space-x-3">
                                <Avatar className="h-8 w-8 flex-shrink-0">
                                  <AvatarImage src={post.author.image || undefined} />
                                  <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <h3 className="font-semibold text-gray-900 truncate">{post.author.name}</h3>
                                    <span className="text-sm text-gray-500">•</span>
                                    <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                                  </div>
                                  <p className="text-gray-700 mt-1 line-clamp-2 text-sm">
                                    {truncateText(post.content, 150)}
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
                            </div>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Pagination for All Results */}
                {results.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={results.pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </TabsContent>

              {/* People Only */}
              <TabsContent value="people">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-3">
                      {results.people.map((person) => (
                        <Link key={person.id} href={`/${lang}/${person.role === 'EMPLOYER' ? 'company' : 'user'}/${person.id}`}>
                          <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={person.image || undefined} />
                              <AvatarFallback>{getInitials(person.name)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 truncate">{person.name}</h3>
                                <Badge variant="secondary" className="text-xs">{person.role}</Badge>
                              </div>
                              {person.headline && (
                                <p className="text-sm text-gray-600 truncate mt-1">{person.headline}</p>
                              )}
                              {person.location && (
                                <div className="flex items-center space-x-1 mt-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <p className="text-xs text-gray-500">{person.location}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {results.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={results.pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Jobs Only */}
              <TabsContent value="jobs">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-3">
                      {results.jobs.map((job) => (
                        <Link key={job.id} href={`/${lang}/jobs/${job.id}`}>
                          <div className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h3 className="font-semibold text-gray-900 truncate">{job.title}</h3>
                                {job.hasApplied && (
                                  <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                    Applied
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">{job.company}</p>
                              <div className="flex items-center space-x-3 mt-2">
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
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {results.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={results.pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </TabsContent>

              {/* Posts Only */}
              <TabsContent value="posts">
                <Card>
                  <CardContent className="pt-6">
                    <div className="grid gap-3">
                      {results.posts.map((post) => (
                        <Link key={post.id} href={`/${lang}/dashboard?post=${post.id}`}>
                          <div className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex items-start space-x-3">
                              <Avatar className="h-8 w-8 flex-shrink-0">
                                <AvatarImage src={post.author.image || undefined} />
                                <AvatarFallback>{getInitials(post.author.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <h3 className="font-semibold text-gray-900 truncate">{post.author.name}</h3>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500">{formatDate(post.createdAt)}</span>
                                </div>
                                <p className="text-gray-700 mt-1 line-clamp-2 text-sm">
                                  {truncateText(post.content, 150)}
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
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                {results.pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={results.pagination.totalPages}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : searchQuery ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600">Try different keywords or search type</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start searching</h3>
            <p className="text-gray-600">Enter a search term to find people, jobs, and posts</p>
          </div>
        )}
      </div>
    </div>
  );
} 