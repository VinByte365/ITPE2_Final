import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarkdownView from "../../components/MarkdownView";
import SlidesEmbed from "../../components/SlidesEmbed";
import StatusBadge from "../../components/StatusBadge";
import { getStudentTopic, listStudentTopicContent, completeTopic } from "../../api/topics";

export default function TopicView() {
  const { id } = useParams();
  const [topic, setTopic] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notAvailable, setNotAvailable] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const t = await getStudentTopic(id);
        const b = await listStudentTopicContent(id);
        if (!cancelled) {
          setTopic(t);
          setBlocks(Array.isArray(b) ? b : []);
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.code === "TOPIC_NOT_AVAILABLE" || err?.status === 403) {
          setNotAvailable(true);
        }
        setError(err?.message || "Failed to load topic.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await completeTopic(id);
      setCompleted(true);
    } catch (err) {
      setError(err?.message || "Failed to mark complete.");
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  if (notAvailable) {
    return (
      <div className="page-shell">
        <h1>Topic not available yet</h1>
        <p>This topic opens on {topic ? new Date(topic.availableFrom).toLocaleDateString() : "a future date"}.</p>
        <p>Please check back later.</p>
      </div>
    );
  }

  if (error && !topic) {
    return <div className="page-shell"><div className="auth-error" role="alert">{error}</div></div>;
  }

  return (
    <div className="page-shell">
      <h1>{topic?.title}</h1>
      {topic?.status && <StatusBadge status={topic.status} />}
      {topic?.description && <p>{topic.description}</p>}
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        Available from: {topic ? new Date(topic.availableFrom).toLocaleDateString() : ""}
      </p>

      {blocks.map((b) => (
        <div key={b.id} style={{ marginTop: 12, padding: 10, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          {b.title && <h3>{b.title}</h3>}
          {b.type === "presentation" && <SlidesEmbed url={b.url} fileUrl={b.filePath ? "#" : null} fileName={b.fileName} title={b.title} />}
          {b.type === "video" && b.url && (
            <p><a href={b.url} target="_blank" rel="noopener noreferrer">Watch video</a></p>
          )}
          {b.body && <MarkdownView content={b.body} />}
          {b.type === "presentation" && b.url && !b.body && (
            <p><a href={b.url} target="_blank" rel="noopener noreferrer">Open presentation</a></p>
          )}
        </div>
      ))}

      {completed ? (
        <p style={{ color: "#065f46", fontWeight: 600, marginTop: 16 }}>Marked as done.</p>
      ) : (
        <button className="button" style={{ marginTop: 16 }} onClick={handleComplete} disabled={completing}>
          {completing ? "Saving..." : "Mark as done"}
        </button>
      )}
      {error && <div className="auth-error" role="alert" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}