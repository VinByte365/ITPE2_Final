import { useCallback, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { startAttempt, submitAttempt, getAttemptHistory } from "../../api/quizzes";
import { getStudentTopic } from "../../api/topics";

export default function QuizRun() {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const [topic, setTopic] = useState(null);
  const [actualQuizId, setActualQuizId] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [blockedState, setBlockedState] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    setBlockedState(null);
    setResult(null);

    try {
      // Step 1: resolve whether paramId is topicId or quizId
      let resolvedQuizId = paramId;
      let loadedTopic = null;
      try {
        loadedTopic = await getStudentTopic(paramId);
        setTopic(loadedTopic);
        if (loadedTopic?.quiz?.id) {
          resolvedQuizId = loadedTopic.quiz.id;
        }
      } catch (topicErr) {
        if (topicErr?.code === "TOPIC_NOT_AVAILABLE") {
          setBlockedState({
            type: "scheduled",
            message: topicErr.message || "This topic is not available yet.",
          });
          return;
        } else if (topicErr?.code === "TOPIC_LOCKED") {
          setBlockedState({
            type: "locked",
            message: topicErr.message || "This topic is locked.",
            blockedByTopicId: topicErr.details?.blockedByTopicId,
          });
          return;
        }
      }

      setActualQuizId(resolvedQuizId);

      // Step 2: start/resume attempt
      const started = await startAttempt(resolvedQuizId);
      setAttempt(started.attempt);
      setQuestions(Array.isArray(started.questions) ? started.questions : []);

      // If attempt was resumed with existing answers
      if (started.attempt?.answers && Array.isArray(started.attempt.answers)) {
        const prefilled = {};
        for (const a of started.attempt.answers) {
          if (a?.questionId) {
            prefilled[a.questionId] = a.optionId !== undefined ? a.optionId : a.text;
          }
        }
        setAnswers(prefilled);
      }

      const h = await getAttemptHistory(resolvedQuizId);
      setHistory(h);
    } catch (err) {
      if (err?.code === "TOPIC_NOT_AVAILABLE") {
        setBlockedState({
          type: "scheduled",
          message: err.message || "Topic not available yet.",
        });
      } else if (err?.code === "TOPIC_LOCKED") {
        setBlockedState({
          type: "locked",
          message: err.message || "Topic is locked.",
          blockedByTopicId: err.details?.blockedByTopicId,
        });
      } else {
        setError(err?.message || "Failed to load quiz.");
      }
    } finally {
      setLoading(false);
    }
  }, [paramId]);

  useEffect(() => {
    load();
  }, [load]);

  const unanswered = questions.filter((q) => {
    const a = answers[q.id];
    return a === undefined || a === null || a === "";
  }).length;

  const handleSubmit = async () => {
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        ...(q.type === "choice" ? { optionId: answers[q.id] } : { text: answers[q.id] || "" }),
      }));
      const r = await submitAttempt(attempt.id, payload);
      setResult(r);
      if (actualQuizId) {
        const h = await getAttemptHistory(actualQuizId);
        setHistory(h);
      }
    } catch (err) {
      setError(err?.message || "Submit failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading quiz...</p>
      </div>
    );
  }

  if (blockedState) {
    return (
      <div className="page-shell qr-narrow">
        <div className="qr-glyph">
          {blockedState.type === "scheduled" ? "⏳" : "🔒"}
        </div>
        <h1 className="qr-title">
          {blockedState.type === "scheduled" ? "Topic Not Available Yet" : "Topic Locked"}
        </h1>
        <p className="qr-lead">
          {blockedState.message}
        </p>
        <div className="qr-actions">
          {blockedState.blockedByTopicId && (
            <Link to={`/student/topics/${blockedState.blockedByTopicId}`} className="btn btn-solid">
              Go to prerequisite topic
            </Link>
          )}
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (error && !attempt) {
    return (
      <div className="page-shell">
        <div className="auth-error" role="alert">{error}</div>
        <div className="qr-cta-top">
          <button type="button" className="btn" onClick={() => navigate(-1)}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Result screen (GATE-10)
  if (result) {
    return (
      <div className="page-shell qr-result">
        <div className={`qr-result-panel ${result.passed ? "qr-result-passed" : "qr-result-failed"}`}>
          <div className="qr-result-glyph">
            {result.passed ? "🎉" : "📝"}
          </div>
          <h1 className={`qr-result-title ${result.passed ? "qr-result-title-passed" : "qr-result-title-failed"}`}>
            {result.passed ? "Congratulations! You Passed" : "Needs Improvement"}
          </h1>
          <p className="qr-result-score">
            Score: {result.score} / {result.total} ({result.percent}%)
          </p>
          <p className="qr-result-note">
            Passing mark: {result.passingPercent}%
          </p>

          {/* GATE-10 Action buttons */}
          <div className="qr-actions">
            {result.passed ? (
              <Link
                to={topic?.subjectId ? `/student/subjects/${topic.subjectId}` : "/student"}
                className="btn btn-solid"
                style={{ textDecoration: "none" }}
              >
                Continue to next topic →
              </Link>
            ) : (
              <>
                <Link
                  to={topic ? `/student/topics/${topic.id}` : -1}
                  className="btn"
                  style={{ textDecoration: "none" }}
                >
                  Repeat this topic
                </Link>
                <button
                  type="button"
                  className="btn btn-solid"
                  onClick={load}
                >
                  Retake Quiz
                </button>
              </>
            )}
          </div>
        </div>

        {/* Answer Review (if enabled) */}
        {result.review && (
          <div style={{ marginTop: 24, padding: 16, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12 }}>Question Review</h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {result.review.map((r, i) => (
                <li
                  key={r.questionId}
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid #f3f4f6",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span>Question {i + 1}</span>
                  <span
                    style={{
                      fontWeight: 600,
                      color: r.correct ? "#065f46" : "#991b1b",
                    }}
                  >
                    {r.correct ? "✓ Correct" : "✗ Incorrect"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* History */}
        {history?.attempts?.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3>Attempt History</h3>
            <p style={{ fontSize: 13, color: "#4b5563" }}>
              Best Score: {history.best?.score}/{history.best?.total} ({history.bestPercent}%) —{" "}
              <strong style={{ color: history.passed ? "#065f46" : "#991b1b" }}>
                {history.passed ? "Passed" : "Failed"}
              </strong>
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          to={topic ? `/student/topics/${topic.id}` : -1}
          style={{ fontSize: 14, textDecoration: "none", color: "#4f46e5" }}
        >
          ← Back to topic
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Quiz</h1>
        {unanswered > 0 ? (
          <span style={{ fontSize: 13, color: "#d97706", fontWeight: 600 }}>
            {unanswered} unanswered
          </span>
        ) : (
          <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>
            All questions answered
          </span>
        )}
      </div>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {questions.map((q, idx) => (
        <fieldset
          key={q.id}
          style={{
            padding: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            marginBottom: 16,
            background: "#fff",
          }}
        >
          <legend style={{ fontWeight: 600, fontSize: 15, padding: "0 6px" }}>
            Question {idx + 1} ({q.points} {q.points === 1 ? "point" : "points"})
          </legend>

          <p style={{ margin: "4px 0 12px", fontSize: 15 }}>{q.prompt}</p>

          {q.type === "choice" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {(q.options || []).map((opt) => (
                <label
                  key={opt.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 6,
                    background: answers[q.id] === opt.id ? "#eff6ff" : "transparent",
                  }}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt.id}
                    checked={answers[q.id] === opt.id}
                    onChange={() => setAnswers({ ...answers, [q.id]: opt.id })}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          )}

          {q.type === "text" && (
            <div>
              <input
                type="text"
                className="input"
                placeholder="Type your answer here..."
                value={answers[q.id] || ""}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
              />
            </div>
          )}
        </fieldset>
      ))}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
        <button
          type="button"
          className="btn btn-solid"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "Submitting..." : "Submit Answers"}
        </button>
      </div>
    </div>
  );
}
