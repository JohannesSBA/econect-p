'use client'

import axios from 'axios';
import { useEffect, useState } from 'react';
import { Globe, Search } from 'lucide-react';
import { JobListing } from '../../types/prisma';
import { Input } from './ui/input';



export default function LandingJobListings() {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await axios.get('/api/jobs/landing');
        setJobs(data);
      } catch (err) {
        setError('Failed to load job listings');
        console.error('Error fetching jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        {error}
      </div>
    );
  }

  return (
    <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black">Latest Job Opportunities</h3>
          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
            99+ New Listings
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Search className="h-5 w-5 text-gray-400" />
            <Input placeholder="Search job titles or keywords" />
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Globe className="h-5 w-5 text-blue-600" />
            <span className="text-blue-700 font-medium">Anywhere in Ethiopia</span>
          </div>
        </div>

        <div className="space-y-3">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100 hover:shadow-md transition-shadow"
            >
              <div>
                <div className="font-medium text-gray-900">{job.title}</div>
                <div className="text-sm text-gray-600">{job.company}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-600">{job.salary}</div>
                <div className="text-xs text-gray-500">per month</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
