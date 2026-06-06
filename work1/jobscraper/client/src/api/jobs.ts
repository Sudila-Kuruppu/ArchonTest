import { apiRequest } from './client';

export interface JobListing {
  board: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  postedAt: string;
}

interface SearchResult {
  jobs: JobListing[];
  errors: { board: string; error: string }[];
}

export async function searchJobs(q: string, location: string): Promise<SearchResult> {
  return apiRequest<SearchResult>(`/jobs/search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`);
}
