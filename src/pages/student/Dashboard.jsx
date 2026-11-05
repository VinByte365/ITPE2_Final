// src/pages/student/Dashboard.jsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listStudentSubjects } from '../../api/subjects';
import Skeleton from '../../components/Skeleton';

export default function StudentDashboard() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listStudentSubjects();
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
      <p><Link to="/student/join" className="btn">Join a subject</Link></p>
      {subjects.length === 0 ? (
        <div className="empty-state">
          You haven't joined any subjects yet. Use a join code from your faculty to get started.
        </div>
      ) : (
        <div className="subject-grid">
          {subjects.map((s) => (
            <div key={s.id} className="subject-card">
              <h2>{s.name}</h2>
              <p className="subject-code">{s.code} · {s.term} · {s.schoolYear}</p>
              {s.facultyName && <p>Instructor: {s.facultyName}</p>}
              <Link to={`/student/subjects/${s.id}`}>View topics</Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}