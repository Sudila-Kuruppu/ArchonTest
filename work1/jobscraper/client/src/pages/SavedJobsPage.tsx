import { useState, useEffect } from 'react';
import { getSaved, SavedJob } from '../api/saved';
import { JobCard } from '../components/JobCard';
import { ExportMenu } from '../components/ExportMenu';

export function SavedJobsPage() {
  const [jobs, setJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = () => {
    setLoading(true);
    getSaved()
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  if (loading) {
    return <div className="loading">Loading saved jobs...</div>;
  }

  return (
    <div className="saved-jobs-page">
      <div className="results-header">
        <h2>My Saved Jobs ({jobs.length})</h2>
      </div>
      <div className="results-toolbar">
        {jobs.length > 0 && <ExportMenu />}
      </div>
      {jobs.length === 0 ? (
        <div className="empty-state">
          <p>No saved jobs yet. Search for jobs and save them for later.</p>
        </div>
      ) : (
        <div className="job-cards">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved
              savedId={job.id}
              onSavedChange={fetchSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}
