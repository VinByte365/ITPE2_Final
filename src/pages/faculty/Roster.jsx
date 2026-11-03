// src/pages/faculty/Roster.jsx
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getRoster, removeStudent } from '../../api/subjects';

export default function Roster() {
  const { id } = useParams();
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getRoster(id);
      setRoster(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load roster.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (studentId) => {
    if (!window.confirm('Remove this student from the subject?')) return;
    try {
      await removeStudent(id, studentId);
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to remove student.');
    }
  };

  if (loading) return <div className="auth-page"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <h1>Roster</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {roster.length === 0 ? (
        <p>No students enrolled yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Student number</th>
              <th>Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {roster.map((e) => (
              <tr key={e.id}>
                <td>{e.student?.studentNumber}</td>
                <td>{e.student?.lastName}, {e.student?.firstName}</td>
                <td>{e.status}</td>
                <td>
                  {e.status === 'active' && (
                    <button onClick={() => handleRemove(e.student?.id)}>Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}