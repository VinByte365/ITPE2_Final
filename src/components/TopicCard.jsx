// src/components/TopicCard.jsx
import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function TopicCard({ topic, isStudent }) {
  const scheduled = topic.state === 'scheduled' || (topic.status === 'published' && new Date(topic.availableFrom) > new Date());

  const card = (
    <div
      className="subject-card"
      style={scheduled ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
      aria-disabled={scheduled ? 'true' : undefined}
    >
      <h3 style={{ margin: '0 0 4px' }}>
        {topic.position}. {topic.title}
      </h3>
      {topic.description && <p style={{ margin: '0 0 6px', fontSize: 13 }}>{topic.description}</p>}
      <p style={{ margin: '0 0 6px', fontSize: 12 }}>
        {scheduled ? `Opens ${new Date(topic.availableFrom).toLocaleDateString()}` : (topic.state || topic.status)}
      </p>
      <StatusBadge status={topic.state || topic.status} />
    </div>
  );

  if (isStudent && !scheduled) {
    return <Link to={`/student/topics/${topic.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>{card}</Link>;
  }
  return card;
}