// src/components/TopicCard.jsx
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function TopicCard({ topic, isStudent }) {
  const isScheduled = topic.state === 'scheduled' || (topic.status === 'published' && new Date(topic.availableFrom) > new Date());
  const isLocked = topic.state === 'locked';
  const isBlocked = isStudent && (isScheduled || isLocked);

  let helperText = '';
  if (isScheduled) {
    helperText = `Opens ${new Date(topic.availableFrom).toLocaleDateString()}`;
  } else if (isLocked) {
    helperText = topic.reason || 'Locked';
  } else if (topic.state === 'pending_review') {
    helperText = 'Waiting for instructor to grade';
  } else if (topic.state === 'failed') {
    helperText = 'Repeat this topic';
  } else if (topic.state === 'completed') {
    helperText = 'Completed';
  } else if (topic.state === 'open') {
    helperText = 'Available';
  }

  const card = (
    <div
      className={`subject-card ${isBlocked ? 'topic-blocked' : ''}`}
      style={isBlocked ? { cursor: 'not-allowed' } : {}}
      aria-disabled={isBlocked ? 'true' : undefined}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>
          {topic.position}. {topic.title}
        </h3>
        <StatusBadge status={topic.state || topic.status} />
      </div>

      {topic.description && (
        <p style={{ margin: '4px 0 8px', fontSize: 13, color: 'var(--muted)' }}>
          {topic.description}
        </p>
      )}

      {helperText && (
        <p style={{ margin: '4px 0 0', fontSize: 12, color: isLocked || isScheduled ? 'var(--muted)' : 'var(--ink)', fontWeight: 500 }}>
          {helperText}
        </p>
      )}
    </div>
  );

  if (isStudent && !isBlocked) {
    return (
      <Link
        to={`/student/topics/${topic.id}`}
        style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
      >
        {card}
      </Link>
    );
  }

  return card;
}
