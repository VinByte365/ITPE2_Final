// src/components/StatusBadge.jsx
const COLORS = {
  draft: { bg: '#e5e7eb', fg: '#374151', label: 'Draft' },
  published: { bg: '#d1fae5', fg: '#065f46', label: 'Published' },
  scheduled: { bg: '#fef3c7', fg: '#92400e', label: 'Scheduled' },
  open: { bg: '#dbeafe', fg: '#1e40af', label: 'Open' },
};

export default function StatusBadge({ status }) {
  const c = COLORS[status] || { bg: '#e5e7eb', fg: '#374151', label: status };
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
      }}
    >
      {c.label}
    </span>
  );
}