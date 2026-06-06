import { SearchForm } from '../components/SearchForm';

export function HomePage() {
  return (
    <div className="home-page">
      <div className="hero">
        <h1>Search Jobs Across Multiple Boards</h1>
        <p className="hero-subtitle">
          Find listings from LinkedIn, Indeed, and SimplyHired &mdash; all in one place.
        </p>
        <SearchForm />
      </div>
    </div>
  );
}
