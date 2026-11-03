import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getFacultyQuiz, upsertQuizMeta, updateQuizStatus, listQuestions, createQuestion, deleteQuestion, regradeQuiz } from "../../api/quizzes";

export default function QuizBuilder() {
  const { id: topicId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("Quiz");
  const [mode, setMode] = useState("built");
  const [showAnswers, setShowAnswers] = useState(false);

  // new question form
  const [qType, setQType] = useState("choice");
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState(["", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qAccepted, setQAccepted] = useState("");
  const [qPoints, setQPoints] = useState(1);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const q = await getFacultyQuiz(topicId);
      setQuiz(q);
      if (q) {
        setTitle(q.title || "Quiz");
        setMode(q.mode || "built");
        setShowAnswers(!!q.showAnswers);
        const qs = await listQuestions(q.id);
        setQuestions(Array.isArray(qs) ? qs : []);
      } else {
        setQuestions([]);
      }
    } catch (err) { setError(err?.message || "Failed to load."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [topicId]);

  const handleCreateQuiz = async () => {
    try {
      const q = await upsertQuizMeta(topicId, { title, mode, showAnswers });
      setQuiz(q);
      load();
    } catch (err) { setError(err?.message || "Failed to create quiz."); }
  };

  const handleSaveMeta = async () => {
    if (!quiz) return;
    try {
      await upsertQuizMeta(topicId, { title, showAnswers });
      load();
    } catch (err) { setError(err?.message || "Save failed."); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!quiz) return;
    try {
      const payload = qType === "choice"
        ? { type: "choice", prompt: qPrompt, options: qOptions.filter((o) => o.trim()).map((label) => ({ label })), correctOptionIndex: qCorrect, points: Number(qPoints) }
        : { type: "text", prompt: qPrompt, acceptedAnswers: qAccepted.split(",").map((s) => s.trim()).filter(Boolean), points: Number(qPoints) };
      await createQuestion(quiz.id, payload);
      setQPrompt(""); setQOptions(["", ""]); setQAccepted("");
      load();
    } catch (err) { setError(err?.message || "Add question failed."); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    try { await deleteQuestion(id); load(); }
    catch (err) { setError(err?.message || "Delete failed."); }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    try {
      const newStatus = quiz.status === "published" ? "draft" : "published";
      await updateQuizStatus(quiz.id, newStatus);
      load();
    } catch (err) { setError(err?.message || "Publish failed."); }
  };

  const handleRegrade = async () => {
    if (!quiz) return;
    try {
      const r = await regradeQuiz(quiz.id);
      alert(`Regraded ${r.regraded}, changed ${r.changed}`);
    } catch (err) { setError(err?.message || "Regrade failed."); }
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <h1>Quiz Builder</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}

      {!quiz ? (
        <div>
          <p>No quiz yet. Create one.</p>
          <div><label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label></div>
          <div><label>Mode<select value={mode} onChange={(e) => setMode(e.target.value)}><option value="built">built</option><option value="uploaded">uploaded</option></select></label></div>
          <div><label><input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} /> Show answers after submit</label></div>
          <button className="button" onClick={handleCreateQuiz}>Create quiz</button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12 }}>
            <strong>{quiz.title}</strong> - {quiz.mode} - {quiz.status} - {questions.length}/20 (min 10 to publish)
          </div>
          <div style={{ marginBottom: 12 }}>
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <label style={{ marginLeft: 8 }}><input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} /> Show answers</label>
            <button onClick={handleSaveMeta} style={{ marginLeft: 8 }}>Save meta</button>
            <button onClick={handlePublish} style={{ marginLeft: 8 }}>{quiz.status === "published" ? "Unpublish" : "Publish"}</button>
            <button onClick={handleRegrade} style={{ marginLeft: 8 }}>Regrade</button>
          </div>

          <h2>Questions</h2>
          {questions.length === 0 && <p>No questions yet.</p>}
          <ul style={{ listStyle: "none", padding: 0 }}>
            {questions.map((q, idx) => (
              <li key={q.id} style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 6 }}>
                <strong>{idx + 1}. {q.type}</strong> -- {q.prompt} ({q.points} pts)
                <button style={{ marginLeft: 8 }} onClick={() => handleDeleteQuestion(q.id)}>Delete</button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleAddQuestion} style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
            <h3>Add question</h3>
            <div><label>Type<select value={qType} onChange={(e) => setQType(e.target.value)}><option value="choice">choice</option><option value="text">text</option></select></label></div>
            <div><label>Prompt<input value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} required /></label></div>
            {qType === "choice" && (
              <div>
                {qOptions.map((o, i) => (
                  <div key={i}>
                    <input value={o} onChange={(e) => { const n = [...qOptions]; n[i] = e.target.value; setQOptions(n); }} placeholder={`Option ${i + 1}`} />
                    <label style={{ marginLeft: 6 }}><input type="radio" checked={qCorrect === i} onChange={() => setQCorrect(i)} /> correct</label>
                  </div>
                ))}
                <button type="button" onClick={() => setQOptions([...qOptions, ""])}>+ option</button>
              </div>
            )}
            {qType === "text" && (
              <div><label>Accepted answers (comma-separated)<input value={qAccepted} onChange={(e) => setQAccepted(e.target.value)} /></label></div>
            )}
            <div><label>Points<input type="number" value={qPoints} onChange={(e) => setQPoints(e.target.value)} /></label></div>
            <button type="submit" className="button">Add</button>
          </form>
        </>
      )}
    </div>
  );
}