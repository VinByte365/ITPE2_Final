import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import MarkdownView from "../../components/MarkdownView";
import SlidesEmbed from "../../components/SlidesEmbed";
import StatusBadge from "../../components/StatusBadge";
import { getStudentTopic, listStudentTopicContent, completeTopic } from "../../api/topics";

export default function TopicView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockedState, setBlockedState] = useState(null); // { type: 'scheduled' | 'locked', reason, availableFrom, blockedByTopicId }
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setBlockedState(null);
      try {
        const t = await getStudentTopic(id);
        const b = await listStudentTopicContent(id);
        if (!cancelled) {
          setTopic(t);
          setBlocks(Array.isArray(b) ? b : []);
          if (t.state === "completed") setCompleted(true);
        }
      } catch (err) {
        if (cancelled) return;
        if (err?.code === "TOPIC_NOT_AVAILABLE") {
          setBlockedState({
            type: "scheduled",
            message: err.message || "This topic has not opened yet.",
            availableFrom: err.details?.availableFrom,
          });
        } else if (err?.code === "TOPIC_LOCKED") {
          setBlockedState({
            type: "locked",
            message: err.message || "This topic is locked until earlier requirements are met.",
            blockedByTopicId: err.details?.blockedByTopicId,
          });
        } else {
          setError(err?.message || "Failed to load topic.");
        }
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

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading topic...</p>
      </div>
    );
  }

  // GATE-11: Friendly handling of blocked direct URLs
  if (blockedState) {
    return (
      <div className="page-shell" style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {blockedState.type === "scheduled" ? "⏳" : "🔒"}
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          {blockedState.type === "scheduled" ? "Topic Not Available Yet" : "Topic Locked"}
        </h1>
        <p style={{ color: "#4b5563", fontSize: 16, marginBottom: 16 }}>
          {blockedState.message}
        </p>

        {blockedState.availableFrom && (
          <p style={{ fontSize: 14, color: "#6b7280", marginBottom: 24 }}>
            Scheduled to open on: <strong>{new Date(blockedState.availableFrom).toLocaleString()}</strong>
          </p>
        )}

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {blockedState.blockedByTopicId && (
            <Link
              to={`/student/topics/${blockedState.blockedByTopicId}`}
              className="btn btn-solid"
            >
              Go to prerequisite topic
            </Link>
          )}
          <button
            type="button"
            className="btn"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (error && !topic) {
    return (
      <div className="page-shell">
        <div className="auth-error" role="alert">{error}</div>
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell" id="content">
      <div style={{ marginBottom: 16 }}>
        <Link to={`/student/subjects/${topic?.subjectId}`} style={{ fontSize: 14, textDecoration: "none", color: "#4f46e5" }}>
          ← Back to subject
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 6px" }}>{topic?.title}</h1>
          <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
            Available from: {topic ? new Date(topic.availableFrom).toLocaleDateString() : ""}
          </p>
        </div>
        {topic?.state && <StatusBadge status={topic.state} />}
      </div>

      {topic?.description && (
        <p style={{ fontSize: 15, color: "#374151", marginBottom: 20 }}>{topic.description}</p>
      )}

      {/* Content Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            style={{
              padding: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              background: "#fff",
            }}
          >
            {b.title && <h3 style={{ marginTop: 0, marginBottom: 12 }}>{b.title}</h3>}
            {b.type === "presentation" && (
              <SlidesEmbed
                url={b.url}
                fileUrl={b.filePath ? `/api/v1/student/content/${b.id}/download-url` : null}
                fileName={b.fileName}
                title={b.title}
              />
            )}
            {b.type === "video" && b.url && (
              <p style={{ margin: 0 }}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  ▶ Watch video
                </a>
              </p>
            )}
            {b.body && <MarkdownView content={b.body} />}
            {b.type === "presentation" && b.url && !b.body && (
              <p style={{ margin: "8px 0 0" }}>
                <a href={b.url} target="_blank" rel="noopener noreferrer">
                  Open presentation link
                </a>
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Topic Completion or Quiz Action */}
      <div
        style={{
          marginTop: 24,
          padding: 20,
          background: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
        }}
      >
        {topic?.quiz ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <h2 style={{ fontSize: 18, margin: 0 }}>Quiz: {topic.quiz.title}</h2>
              <span style={{ fontSize: 13, color: "#6b7280" }}>
                {topic.quiz.mode === "uploaded" ? "Manual Review" : "Built-in"}
              </span>
            </div>

            {topic.quiz.instructions && (
              <p style={{ fontSize: 14, color: "#4b5563", marginBottom: 12 }}>
                {topic.quiz.instructions}
              </p>
            )}

            {topic.quiz.mode === "built" ? (
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link
                  to={`/student/topics/${topic.id}/quiz`}
                  className="btn btn-solid"
                  style={{ textDecoration: "none" }}
                >
                  {topic.state === "completed"
                    ? "Retake Quiz"
                    : topic.state === "failed"
                    ? "Repeat Quiz"
                    : "Take Quiz"}
                </Link>
                {topic.state === "completed" && (
                  <span style={{ color: "#065f46", fontWeight: 600, fontSize: 14 }}>
                    ✓ Passed
                  </span>
                )}
                {topic.state === "failed" && (
                  <span style={{ color: "#991b1b", fontWeight: 600, fontSize: 14 }}>
                    ↺ Score below passing mark. Retake allowed.
                  </span>
                )}
              </div>
            ) : (
              /* Uploaded Quiz mode link/notice */
              <div>
                <Link
                  to={`/student/topics/${topic.id}/quiz`}
                  className="btn btn-solid"
                  style={{ textDecoration: "none" }}
                >
                  Submit Quiz Image
                </Link>
              </div>
            )}
          </div>
        ) : (
          /* Quiz-less topic */
          <div>
            <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Topic Completion</h2>
            <p style={{ fontSize: 14, color: "#4b5563", margin: "0 0 16px" }}>
              This topic has no quiz. Mark it as done when you have reviewed all the material.
            </p>
            {completed ? (
              <p style={{ color: "#065f46", fontWeight: 600, margin: 0 }}>
                ✓ You have completed this topic.
              </p>
            ) : (
              <button
                className="btn btn-solid"
                onClick={handleComplete}
                disabled={completing}
              >
                {completing ? "Saving..." : "Mark as done"}
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginTop: 16 }}>
          {error}
        </div>
      )}
    </div>
  );
}
