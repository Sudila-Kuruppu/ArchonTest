import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="layout">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">JobScraper</Link>
          <nav className="nav">
            {user ? (
              <>
                <Link to="/saved" className="nav-link">Saved Jobs</Link>
                <span className="nav-email">{user.email}</span>
                <button onClick={logout} className="btn btn-outline btn-sm">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">{children}</main>
      <footer className="footer">
        <p>JobScraper &copy; {new Date().getFullYear()} &mdash; Search across LinkedIn, Indeed, and SimplyHired</p>
      </footer>
    </div>
  );
}
