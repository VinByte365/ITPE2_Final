// src/components/StatusBadge.jsx
const STATUS_CONFIG = {
  draft: { bg: '#e5e7eb', fg: '#1f2937', label: 'Draft', icon: '📝' },
  published: { bg: '#d1fae5', fg: '#065f46', label: 'Published', icon: '🌐' },
  scheduled: { bg: '#fef3c7', fg: '#92400e', label: 'Scheduled', icon: '⏳' },
  locked: { bg: '#f3f4f6', fg: '#374151', label: 'Locked', icon: '🔒' },
  open: { bg: '#dbeafe', fg: '#1e40af', label: 'Open', icon: '📖' },
  completed: { bg: '#dcfce7', fg: '#166534', label: 'Completed', icon: '✓' },
  pending_review: { bg: '#fef9c3', fg: '#854d0e', label: 'Pending Review', icon: '⏳' },
  failed: { bg: '#fee2e2', fg: '#991b1b', label: 'Repeat Topic', icon: '↺' },
  graded: { bg: '#dcfce7', fg: '#166534', label: 'Graded', icon: '✓' },
  in_progress: { bg: '#e0e7ff', fg: '#3730a3', label: 'In Progress', icon: '▶' },
};

export default function StatusBadge({ status }) {
  const c = STATUS_CONFIG[status] || { bg: '#e5e7eb', fg: '#1f2937', label: status, icon: '' };
  return (
    <span
      className={`status-badge status-${status}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {c.icon && <span aria-hidden="true">{c.icon}</span>}
      <span>{c.label}</span>
    </span>
  );
}
