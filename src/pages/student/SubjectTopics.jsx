import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import TopicCard from "../../components/TopicCard";
import StatusBadge from "../../components/StatusBadge";
import { getStudentSubject } from "../../api/subjects";
import { listStudentTopics } from "../../api/topics";

export default function SubjectTopics() {
  const { id: subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [subj, tops] = await Promise.all([
          getStudentSubject(subjectId),
          listStudentTopics(subjectId),
        ]);
        if (!cancelled) {
          setSubject(subj);
          setTopics(Array.isArray(tops) ? tops : []);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId]);

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <h1>{subject?.name || "Subject"}</h1>
      {subject && <p>Passing: {subject.passingPercent}%</p>}
      {error && <div className="auth-error" role="alert">{error}</div>}
      {topics.length === 0 ? (
        <p>No topics yet.</p>
      ) : (
        <div className="subject-grid">
          {topics.map((t) => (
            <TopicCard key={t.id} topic={t} isStudent />
          ))}
        </div>
      )}
    </div>
  );
}