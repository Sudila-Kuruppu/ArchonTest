import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchJobs, JobListing } from '../api/jobs';
import { JobList } from '../components/JobList';
import { ExportMenu } from '../components/ExportMenu';

export function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [errors, setErrors] = useState<{ board: string; error: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q || !location) return;
    setLoading(true);
    searchJobs(q, location)
      .then((result) => {
        setJobs(result.jobs);
        setErrors(result.errors);
      })
      .catch((err) => {
        setErrors([{ board: 'System', error: err.message }]);
      })
      .finally(() => setLoading(false));
  }, [q, location]);

  return (
    <div className="search-results-page">
      <div className="results-header">
        <Link to="/" className="back-link">&larr; Back to Search</Link>
        <h2>Results for &ldquo;{q}&rdquo; in {location}</h2>
      </div>
      <div className="results-toolbar">
        <ExportMenu />
      </div>
      <JobList jobs={jobs} loading={loading} errors={errors} />
    </div>
  );
}
