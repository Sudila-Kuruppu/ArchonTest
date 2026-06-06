import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SearchResults } from './pages/SearchResults';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SavedJobsPage } from './pages/SavedJobsPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <SavedJobsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Layout>
  );
}
