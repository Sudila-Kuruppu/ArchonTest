import { apiRequest } from './client';

export interface SavedJob {
  id: number;
  user_id: number;
  board: string;
  job_id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  description: string;
  posted_at: string;
  saved_at: string;
}

interface SavedListResponse {
  jobs: SavedJob[];
}

interface SaveResponse {
  job: SavedJob;
}

export async function getSaved(): Promise<SavedJob[]> {
  const data = await apiRequest<SavedListResponse>('/saved');
  return data.jobs;
}

export async function saveJob(job: {
  board: string;
  jobId: string;
  title: string;
  company: string;
  location?: string;
  url?: string;
  description?: string;
  postedAt?: string;
}): Promise<SavedJob> {
  const data = await apiRequest<SaveResponse>('/saved', {
    method: 'POST',
    body: JSON.stringify(job),
  });
  return data.job;
}

export async function removeSaved(id: number): Promise<void> {
  await apiRequest(`/saved/${id}`, { method: 'DELETE' });
}
