import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import MarkdownView from "../../components/MarkdownView";
import SlidesEmbed from "../../components/SlidesEmbed";
import StatusBadge from "../../components/StatusBadge";
import {
  CheckIcon,
  HourglassIcon,
  RotateIcon,
} from "../../components/Icons";
import {
  getStudentTopic,
  listStudentTopicContent,
  completeTopic,
} from "../../api/topics";

function percentOf(score, total) {
  if (!total || total <= 0) return 0;
  return Math.round((score / total) * 100 * 100) / 100;
}

export default function TopicView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blockedState, setBlockedState] = useState(null);
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

  const latestGradedAttempt =
    topic?.attempts?.find((a) => a.status === "graded") ?? null;

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading topic...</p>
      </div>
    );
  }

  if (blockedState) {
    return (
      <div className="page-shell" style={{ maxWidth: 640, margin: "40px auto", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          <HourglassIcon />
        </div>
        <h1 style={{ fontSize: 24, marginBottom: 8 }}>
          {blockedState.type === "scheduled" ? "Topic Not Available Yet" : "Topic Locked"}
        </h1>
        <p style={{ color: "var(--muted)", fontSize: 16, marginBottom: 16 }}>
          {blockedState.message}
        </p>

        {blockedState.availableFrom && (
          <p style={{ fontSize: 14, color: "var(--muted)", marginBottom: 24 }}>
            Scheduled to open on:{" "}
            <strong>{new Date(blockedState.availableFrom).toLocaleString()}</strong>
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
        <Link
          to={`/student/subjects/${topic?.subjectId}`}
          style={{ fontSize: 14, textDecoration: "none", color: "var(--accent-ink)" }}
        >
          ← Back to subject
        </Link>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <div>
          <h1 style={{ margin: "0 0 6px" }}>{topic?.title}</h1>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: 0 }}>
            Available from: {topic ? new Date(topic.availableFrom).toLocaleDateString() : ""}
          </p>
        </div>
        {topic?.state && <StatusBadge status={topic.state} />}
      </div>

      {topic?.description && (
        <p style={{ fontSize: 15, color: "var(--ink-soft)", marginBottom: 20 }}>
          {topic.description}
        </p>
      )}

      {/* Content Blocks */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
        {blocks.map((b) => (
          <div
            key={b.id}
            style={{
              padding: 16,
              border: "1px solid var(--line)",
              borderRadius: 2,
              background: "var(--paper-2)",
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
                  <RotateIcon /> Watch video
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
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          borderRadius: 2,
        }}
      >
        {topic?.quiz ? (
          <div className="qr-result">
            <div className="qr-quiz-head">
              <h2 style={{ fontSize: 18, margin: 0 }}>Quiz: {topic.quiz.title}</h2>
              <span className="qr-lead">
                {topic.quiz.mode === "uploaded" ? "Manual Review" : "Built-in"}
              </span>
            </div>

            {topic.quiz.instructions && (
              <p className="qr-lead">{topic.quiz.instructions}</p>
            )}

            {/* Attempt status */}
            {topic.state === "pending_review" && (
              <div className="qr-review">
                <StatusBadge status="pending_review" />
                <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--ink-soft)" }}>
                  Waiting for your instructor to grade.
                </p>
              </div>
            )}

            {topic.attempts && (
              <div>
                {topic.state === "completed" && (
                  <div className="qr-result-panel qr-result-passed">
                    <div className="qr-result-glyph">
                      <CheckIcon />
                    </div>
                    <h2 className="qr-result-title qr-result-title-passed">Passed</h2>
                    <p className="qr-result-score">
                      {latestGradedAttempt.score}/{latestGradedAttempt.total}{" "}
                      ({percentOf(latestGradedAttempt.score, latestGradedAttempt.total)}%)
                    </p>
                    {latestGradedAttempt.feedback && (
                      <div style={{ marginTop: 12, textAlign: "left" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Feedback
                        </p>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)", whiteSpace: "pre-wrap" }}>
                          {latestGradedAttempt.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
                {topic.state === "failed" && (
                  <div className="qr-result-panel qr-result-failed">
                    <div className="qr-result-glyph">
                      <RotateIcon />
                    </div>
                    <h2 className="qr-result-title qr-result-title-failed">Repeat Topic</h2>
                    <p className="qr-result-score">
                      {latestGradedAttempt.score}/{latestGradedAttempt.total}{" "}
                      ({percentOf(latestGradedAttempt.score, latestGradedAttempt.total)}%)
                    </p>
                    <p className="qr-result-note">Score below passing mark. Retake allowed.</p>
                    {latestGradedAttempt.feedback && (
                      <div style={{ marginTop: 12, textAlign: "left" }}>
                        <p style={{ margin: "0 0 4px", fontSize: 13, color: "var(--muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Feedback
                        </p>
                        <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)", whiteSpace: "pre-wrap" }}>
                          {latestGradedAttempt.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {topic.quiz.mode === "built" ? (
              <div className="qr-actions qr-cta-top">
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
              </div>
            ) : (
              <div className="qr-actions qr-cta-top">
                <Link
                  to={`/student/topics/${topic.id}/quiz`}
                  className="btn btn-solid"
                  style={{ textDecoration: "none" }}
                >
                  Submit Quiz Image
                </Link>
              </div>
            )}

            {/* Attempt history */}
            {topic.attempts && topic.attempts.length > 1 && (
              <div className="qr-history">
                <h3>Attempts</h3>
                <ul>
                  {topic.attempts.map((a) => (
                    <li key={a.id} className={`qr-review-status-${a.passed ? "passed" : "failed"}`}>
                      <span>Attempt {a.attemptNo}</span>
                      <span>
                        {a.status === "graded"
                          ? `${a.score}/${a.total} (${percentOf(a.score, a.total)}%)`
                          : a.status === "pending_review"
                          ? "Pending review"
                          : a.status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          /* Quiz-less topic */
          <div>
            <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Topic Completion</h2>
            <p style={{ fontSize: 14, color: "var(--muted)", margin: "0 0 16px" }}>
              This topic has no quiz. Mark it as done when you have reviewed all the material.
            </p>
            {completed ? (
              <p style={{ color: "var(--ink)", fontWeight: 600, margin: 0 }}>
                <CheckIcon /> You have completed this topic.
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
