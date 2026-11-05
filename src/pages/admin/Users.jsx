// src/pages/admin/Users.jsx
import { useCallback, useEffect, useState } from 'react';
import { listProfiles, updateProfile } from '../../api/admin.js';
import { useAuth } from '../../auth/AuthContext';
import Loading from '../../components/Loading';

export default function AdminUsers() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState({ approvalStatus: '', role: '' });

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filter.approvalStatus) params.set('approvalStatus', filter.approvalStatus);
      if (filter.role) params.set('role', filter.role);
      const qs = params.toString();
      const data = await listProfiles(qs);
      setProfiles(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id) => {
    try {
      await updateProfile(id, { approvalStatus: 'approved' });
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to approve.');
    }
  };

  const handleReject = async (id) => {
    try {
      await updateProfile(id, { approvalStatus: 'rejected' });
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to reject.');
    }
  };

  const handleChangeRole = async (id, newRole) => {
    try {
      await updateProfile(id, { role: newRole });
      await load();
    } catch (err) {
      setError(err?.message || 'Failed to change role.');
    }
  };

  if (loading) return <Loading label="Loading users" />;

  return (
    <div className="page-shell">
      <h1>Users</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div className="filters">
        <select value={filter.approvalStatus} onChange={(e) => setFilter((f) => ({ ...f, approvalStatus: e.target.value }))}>
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
        <select value={filter.role} onChange={(e) => setFilter((f) => ({ ...f, role: e.target.value }))}>
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="faculty">Faculty</option>
          <option value="student">Student</option>
        </select>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {profiles.map((p) => (
            <tr key={p.id}>
              <td>{p.fullName || `${p.firstName || ''} ${p.lastName || ''}`.trim()}</td>
              <td>{p.email}</td>
              <td>
                <select value={p.role} onChange={(e) => handleChangeRole(p.id, e.target.value)} disabled={p.id === profile?.id}>
                  <option value="admin">Admin</option>
                  <option value="faculty">Faculty</option>
                  <option value="student">Student</option>
                </select>
              </td>
              <td>{p.approvalStatus}</td>
              <td>
                {p.approvalStatus === 'pending' && (
                  <>
                    <button onClick={() => handleApprove(p.id)}>Approve</button>
                    <button onClick={() => handleReject(p.id)}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {profiles.length === 0 && (
        <p className="empty-state">No users match the current filters.</p>
      )}
    </div>
  );
}