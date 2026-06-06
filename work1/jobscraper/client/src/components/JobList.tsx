import { JobListing } from '../api/jobs';
import { JobCard } from './JobCard';

interface JobListProps {
  jobs: JobListing[];
  loading: boolean;
  errors: { board: string; error: string }[];
}

export function JobList({ jobs, loading, errors }: JobListProps) {
  if (loading) {
    return <div className="loading">Searching for jobs...</div>;
  }

  if (jobs.length === 0 && errors.length === 0) {
    return <div className="empty-state">No jobs found. Try a different search term.</div>;
  }

  return (
    <div className="job-list">
      {errors.length > 0 && (
        <div className="errors-banner">
          {errors.map((e, i) => (
            <p key={i} className="error-item">{e.board}: {e.error}</p>
          ))}
        </div>
      )}
      <p className="results-count">Found {jobs.length} jobs from multiple boards</p>
      <div className="job-cards">
        {jobs.map((job, i) => (
          <JobCard key={`${job.board}-${job.jobId}-${i}`} job={job} />
        ))}
      </div>
    </div>
  );
}
