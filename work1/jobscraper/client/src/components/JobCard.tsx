import { useState } from 'react';
import { JobListing } from '../api/jobs';
import { saveJob, removeSaved, SavedJob } from '../api/saved';
import { useAuth } from '../context/AuthContext';

interface JobCardProps {
  job: JobListing | SavedJob;
  isSaved?: boolean;
  savedId?: number;
  onSavedChange?: () => void;
}

export function JobCard({ job, isSaved, savedId, onSavedChange }: JobCardProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const board = 'board' in job ? job.board : '';
  const title = job.title;
  const company = job.company;
  const location = job.location;
  const url = 'url' in job ? job.url : '';
  const description = 'description' in job ? job.description : '';
  const postedAt = 'postedAt' in job ? job.postedAt : 'posted_at' in job ? job.posted_at : '';

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await saveJob({
        board,
        jobId: 'jobId' in job ? job.jobId : '',
        title,
        company,
        location,
        url,
        description,
        postedAt,
      });
      if (onSavedChange) onSavedChange();
    } catch (err) {
      console.error('Failed to save job:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!savedId) return;
    setSaving(true);
    try {
      await removeSaved(savedId);
      if (onSavedChange) onSavedChange();
    } catch (err) {
      console.error('Failed to remove saved job:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="job-card">
      <div className="job-card-header">
        {board && <span className="board-badge board-${board.toLowerCase()}">{board}</span>}
        <h3 className="job-title">{title}</h3>
      </div>
      <p className="job-company">{company}</p>
      <p className="job-location">{location}</p>
      {description && <p className="job-description">{description.substring(0, 200)}...</p>}
      {postedAt && <p className="job-posted">Posted: {new Date(postedAt).toLocaleDateString()}</p>}
      <div className="job-card-actions">
        {url && (
          <a href={url} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
            View on {board} &rarr;
          </a>
        )}
        {user && !isSaved && (
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-sm">
            {saving ? 'Saving...' : 'Save'}
          </button>
        )}
        {isSaved && savedId && (
          <button onClick={handleRemove} disabled={saving} className="btn btn-danger btn-sm">
            {saving ? 'Removing...' : 'Remove'}
          </button>
        )}
      </div>
    </div>
  );
}
