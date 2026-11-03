import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { startAttempt, submitAttempt, getAttemptHistory } from "../../api/quizzes";

export default function QuizRun() {
  const { id: quizId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const started = await startAttempt(quizId);
      setAttempt(started.attempt);
      setQuestions(Array.isArray(started.questions) ? started.questions : []);
      const h = await getAttemptHistory(quizId);
      setHistory(h);
    } catch (err) { setError(err?.message || "Failed to load quiz."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [quizId]);

  const unanswered = questions.filter((q) => {
    const a = answers[q.id];
    return a === undefined || a === null || a === "";
  }).length;

  const handleSubmit = async () => {
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered. Submit anyway?`)) return;
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({
        questionId: q.id,
        ...(q.type === "choice" ? { optionId: answers[q.id] } : { text: answers[q.id] || "" }),
      }));
      const r = await submitAttempt(attempt.id, payload);
      setResult(r);
      const h = await getAttemptHistory(quizId);
      setHistory(h);
    } catch (err) { setError(err?.message || "Submit failed."); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div className="page-shell"><p>Loading quiz...</p></div>;
  if (error && !attempt) return <div className="page-shell"><div className="auth-error" role="alert">{error}</div></div>;

  if (result) {
    return (
      <div className="page-shell">
        <h1>Result</h1>
        <p>Score: {result.score} / {result.total}</p>
        <p>Percent: {result.percent}%</p>
        <p>Passing mark: {result.passingPercent}%</p>
        <p style={{ fontWeight: 600, color: result.passed ? "#065f46" : "#991b1b" }}>
          {result.passed ? "Passed" : "Failed"}
        </p>
        {!result.passed && <p>Repeat topic</p>}
        {result.review && (
          <div style={{ marginTop: 12 }}>
            <h3>Review</h3>
            <ul>{result.review.map((r) => <li key={r.questionId}>{r.questionId}: {r.correct ? "correct" : "incorrect"}</li>)}</ul>
          </div>
        )}
        {history?.best && (
          <div style={{ marginTop: 12 }}>
            <h3>History</h3>
            <p>Best: {history.best.score}/{history.best.total} ({history.bestPercent}%)</p>
            <p>{history.passed ? "Passed" : "Failed"}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell">
      <h1>Quiz</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <p>Unanswered: {unanswered}</p>
      {questions.map((q, idx) => (
        <div key={q.id} style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8 }}>
          <p><strong>{idx + 1}. {q.prompt}</strong> ({q.points} pts)</p>
          {q.type === "choice" && (q.options || []).map((opt) => (
            <label key={opt.id} style={{ display: "block" }}>
              <input type="radio" name={q.id} value={opt.id} checked={answers[q.id] === opt.id} onChange={() => setAnswers({ ...answers, [q.id]: opt.id })} />
              {" "}{opt.label}
            </label>
          ))}
          {q.type === "text" && (
            <input value={answers[q.id] || ""} onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })} />
          )}
        </div>
      ))}
      <button className="button" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}