import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export function SearchForm() {
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !location.trim()) return;
    navigate(`/search?q=${encodeURIComponent(keyword.trim())}&location=${encodeURIComponent(location.trim())}`);
  };

  return (
    <form className="search-form" onSubmit={handleSubmit}>
      <div className="search-inputs">
        <input
          type="text"
          placeholder="Job title, keyword, or company"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="search-input"
          required
        />
        <input
          type="text"
          placeholder="City, state, or remote"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="search-input"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary btn-lg">Search Jobs</button>
    </form>
  );
}
