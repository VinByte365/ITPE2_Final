// src/pages/faculty/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listFacultySubjects } from '../../api/subjects';
import Skeleton from '../../components/Skeleton';

export default function FacultyDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listFacultySubjects();
        if (!cancelled) setSubjects(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Failed to load subjects.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Skeleton lines={4} />;

  return (
    <div className="page-shell">
      <h1>My Subjects</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <p>
        <Link to="/faculty/subjects/new" className="btn">Create subject</Link>
      </p>
      {subjects.length === 0 ? (
        <div className="empty-state">No subjects yet. Create your first subject to get started.</div>
      ) : (
        <div className="subject-grid">
          {subjects.map((s) => (
            <div key={s.id} className="subject-card">
              <h2>{s.name}</h2>
              <p className="subject-code">{s.code} · {s.term} · {s.schoolYear}</p>
              <p>Students: {s.studentCount ?? 0}</p>
              <p>Passing: {s.passingPercent}%</p>
              <p>Status: {s.status}</p>
              <Link to={`/faculty/subjects/${s.id}`}>View</Link>
              {' · '}
              <Link to={`/faculty/subjects/${s.id}/topics`}>Topics</Link>
              {' · '}
              <Link to={`/faculty/subjects/${s.id}/students`}>Students</Link>
              {' · '}
              <Link to={`/faculty/subjects/${s.id}/settings`}>Settings</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}