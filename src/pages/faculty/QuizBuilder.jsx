import { useCallback, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getFacultyQuiz,
  upsertQuizMeta,
  updateQuizStatus,
  listQuestions,
  createQuestion,
  deleteQuestion,
  regradeQuiz,
  getQuizAttachmentUploadUrl,
} from "../../api/quizzes";
import { uploadToSignedUrl } from "../../api/client";

export default function QuizBuilder() {
  const { id: topicId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Meta state
  const [title, setTitle] = useState("Quiz");
  const [mode, setMode] = useState("built");
  const [instructions, setInstructions] = useState("");
  const [totalItems, setTotalItems] = useState(10);
  const [externalUrl, setExternalUrl] = useState("");
  const [maxAttempts, setMaxAttempts] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  // New question form (for built-in mode)
  const [qType, setQType] = useState("choice");
  const [qPrompt, setQPrompt] = useState("");
  const [qOptions, setQOptions] = useState(["", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [qAccepted, setQAccepted] = useState("");
  const [qPoints, setQPoints] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = await getFacultyQuiz(topicId);
      setQuiz(q);
      if (q) {
        setTitle(q.title || "Quiz");
        setMode(q.mode || "built");
        setInstructions(q.instructions || "");
        setTotalItems(q.totalItems || 10);
        setExternalUrl(q.externalUrl || "");
        setMaxAttempts(q.maxAttempts || "");
        setShowAnswers(!!q.showAnswers);
        if (q.attachmentPath) {
          setAttachment({
            path: q.attachmentPath,
            name: q.attachmentName || "Attached Quiz File",
          });
        }
        if (q.mode === "built") {
          const qs = await listQuestions(q.id);
          setQuestions(Array.isArray(qs) ? qs : []);
        }
      } else {
        setQuestions([]);
      }
    } catch (err) {
      setError(err?.message || "Failed to load quiz.");
    } finally {
      setLoading(false);
    }
  }, [topicId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreateQuiz = async () => {
    setError("");
    setSuccess("");
    try {
      const payload = {
        title,
        mode,
        instructions: instructions || null,
        totalItems: mode === "uploaded" ? Number(totalItems) : null,
        externalUrl: externalUrl || null,
        maxAttempts: maxAttempts ? Number(maxAttempts) : null,
        showAnswers,
      };
      const q = await upsertQuizMeta(topicId, payload);
      setQuiz(q);
      setSuccess("Quiz created successfully.");
      load();
    } catch (err) {
      setError(err?.message || "Failed to create quiz.");
    }
  };

  const handleSaveMeta = async () => {
    if (!quiz) return;
    setError("");
    setSuccess("");
    try {
      const payload = {
        title,
        mode,
        instructions: instructions || null,
        totalItems: mode === "uploaded" ? Number(totalItems) : null,
        externalUrl: externalUrl || null,
        maxAttempts: maxAttempts ? Number(maxAttempts) : null,
        showAnswers,
        attachmentPath: attachment?.path || null,
        attachmentName: attachment?.name || null,
      };
      await upsertQuizMeta(topicId, payload);
      setSuccess("Settings saved.");
      load();
    } catch (err) {
      if (err?.code === "QUIZ_HAS_ATTEMPTS") {
        setError("Cannot switch quiz mode after student attempts have already been submitted.");
      } else {
        setError(err?.message || "Failed to save settings.");
      }
    }
  };

  const handleAttachmentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !quiz) return;
    setUploadingAttachment(true);
    setError("");
    try {
      const { uploadUrl, path } = await getQuizAttachmentUploadUrl(quiz.id, {
        fileName: file.name,
        mime: file.type || "application/octet-stream",
        size: file.size,
      });
      await uploadToSignedUrl(uploadUrl, file);
      setAttachment({ path, name: file.name });
      await upsertQuizMeta(topicId, {
        attachmentPath: path,
        attachmentName: file.name,
        attachmentMime: file.type || null,
      });
      setSuccess("Attachment uploaded.");
    } catch (err) {
      setError(err?.message || "Attachment upload failed.");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!quiz) return;
    setError("");
    try {
      const payload =
        qType === "choice"
          ? {
              type: "choice",
              prompt: qPrompt,
              options: qOptions.filter((o) => o.trim()).map((label) => ({ label })),
              correctOptionIndex: qCorrect,
              points: Number(qPoints),
            }
          : {
              type: "text",
              prompt: qPrompt,
              acceptedAnswers: qAccepted.split(",").map((s) => s.trim()).filter(Boolean),
              points: Number(qPoints),
            };
      await createQuestion(quiz.id, payload);
      setQPrompt("");
      setQOptions(["", ""]);
      setQAccepted("");
      load();
    } catch (err) {
      setError(err?.message || "Add question failed.");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    setError("");
    try {
      await deleteQuestion(id);
      load();
    } catch (err) {
      setError(err?.message || "Delete failed.");
    }
  };

  const handlePublish = async () => {
    if (!quiz) return;
    setError("");
    setSuccess("");
    try {
      const newStatus = quiz.status === "published" ? "draft" : "published";
      await updateQuizStatus(quiz.id, newStatus);
      setSuccess(`Quiz is now ${newStatus}.`);
      load();
    } catch (err) {
      setError(err?.message || "Publish status change failed.");
    }
  };

  const handleRegrade = async () => {
    if (!quiz) return;
    setError("");
    try {
      const r = await regradeQuiz(quiz.id);
      alert(`Regraded ${r.regraded} attempt(s); ${r.changed} score(s) updated.`);
      load();
    } catch (err) {
      setError(err?.message || "Regrade failed.");
    }
  };

  if (loading) return <div className="page-shell"><p>Loading quiz...</p></div>;

  return (
    <div className="page-shell" style={{ maxWidth: 840, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link to={`/faculty/topics/${topicId}`} style={{ fontSize: 14, textDecoration: "none", color: "#4f46e5" }}>
          ← Back to topic editor
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
        <h1 style={{ margin: 0 }}>Quiz Configuration</h1>
        {quiz && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span
              style={{
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                background: quiz.status === "published" ? "#d1fae5" : "#e5e7eb",
                color: quiz.status === "published" ? "#065f46" : "#374151",
              }}
            >
              {quiz.status.toUpperCase()}
            </span>
            <button type="button" className="btn btn-solid" onClick={handlePublish}>
              {quiz.status === "published" ? "Unpublish to Draft" : "Publish Quiz"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="auth-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ padding: 12, borderRadius: 6, background: "#ecfdf5", color: "#065f46", marginBottom: 16 }}>{success}</div>}

      {/* Meta Editor */}
      <div style={{ padding: 20, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 16 }}>General Settings</h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Quiz Title
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Delivery Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db", width: "100%" }}
            >
              <option value="built">Built-in Interactive Quiz (Questions auto-graded)</option>
              <option value="uploaded">Uploaded Quiz (Student submits image, faculty grades)</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
              Instructions / Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Guidelines or instructions for students..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {mode === "uploaded" && (
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Total Items / Maximum Score *
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className="input"
                  value={totalItems}
                  onChange={(e) => setTotalItems(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                Max Attempts (leave blank for unlimited)
              </label>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Unlimited"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {mode === "uploaded" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 4 }}>
              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  External Quiz Link (Optional)
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://forms.google.com/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  Quiz Attachment (PDF, PPTX, Text or Image ≤ 25 MB)
                </label>
                {attachment && (
                  <p style={{ fontSize: 13, color: "#065f46", margin: "0 0 6px" }}>
                    Current attachment: <strong>{attachment.name}</strong>
                  </p>
                )}
                {quiz ? (
                  <input
                    type="file"
                    accept=".pdf,.pptx,.txt,.jpg,.jpeg,.png,.webp"
                    onChange={handleAttachmentUpload}
                    disabled={uploadingAttachment}
                  />
                ) : (
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                    Create quiz first to attach a file.
                  </p>
                )}
                {uploadingAttachment && <span style={{ fontSize: 12, color: "#4f46e5", marginLeft: 8 }}>Uploading...</span>}
              </div>
            </div>
          )}

          {mode === "built" && (
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                />
                <span style={{ fontSize: 14 }}>
                  Show answer review to students after submission
                </span>
              </label>
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            {!quiz ? (
              <button type="button" className="btn btn-solid" onClick={handleCreateQuiz}>
                Create Quiz
              </button>
            ) : (
              <div style={{ display: "flex", gap: 12 }}>
                <button type="button" className="btn btn-solid" onClick={handleSaveMeta}>
                  Save Settings
                </button>
                {quiz.mode === "built" && (
                  <button type="button" className="btn" onClick={handleRegrade}>
                    Regrade All Attempts
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Built-in Mode: Question Builder */}
      {quiz && quiz.mode === "built" && (
        <div style={{ padding: 20, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Questions ({questions.length} / 20)</h2>
            <span style={{ fontSize: 13, color: questions.length >= 10 ? "#065f46" : "#b45309" }}>
              {questions.length >= 10 ? "✓ Ready to publish" : "Needs at least 10 questions to publish"}
            </span>
          </div>

          <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px" }}>
            {questions.map((q, idx) => (
              <li
                key={q.id}
                style={{
                  padding: 12,
                  border: "1px solid #e5e7eb",
                  borderRadius: 6,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <strong style={{ marginRight: 6 }}>{idx + 1}.</strong>
                  <span>{q.prompt}</span>
                  <span style={{ fontSize: 12, color: "#6b7280", marginLeft: 8 }}>
                    ({q.type}, {q.points} {q.points === 1 ? "pt" : "pts"})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn"
                  style={{ padding: "4px 8px", fontSize: 12, color: "#991b1b" }}
                  onClick={() => handleDeleteQuestion(q.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {questions.length < 20 && (
            <form
              onSubmit={handleAddQuestion}
              style={{ padding: 16, border: "1px dashed #cbd5e1", borderRadius: 6, background: "#f8fafc" }}
            >
              <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>Add New Question</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Type</label>
                    <select
                      value={qType}
                      onChange={(e) => setQType(e.target.value)}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db" }}
                    >
                      <option value="choice">Multiple Choice</option>
                      <option value="text">Short Text</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Points</label>
                    <input
                      type="number"
                      min={1}
                      value={qPoints}
                      onChange={(e) => setQPoints(e.target.value)}
                      style={{ width: "100%", padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Question Prompt</label>
                  <input
                    type="text"
                    value={qPrompt}
                    onChange={(e) => setQPrompt(e.target.value)}
                    placeholder="Enter question text..."
                    required
                    style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
                  />
                </div>

                {qType === "choice" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>
                      Options (Select the correct option)
                    </label>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {qOptions.map((opt, i) => (
                        <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={qCorrect === i}
                            onChange={() => setQCorrect(i)}
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const n = [...qOptions];
                              n[i] = e.target.value;
                              setQOptions(n);
                            }}
                            placeholder={`Option ${i + 1}`}
                            style={{ flex: 1, padding: "6px 10px", borderRadius: 4, border: "1px solid #d1d5db" }}
                          />
                        </div>
                      ))}
                    </div>
                    {qOptions.length < 6 && (
                      <button
                        type="button"
                        className="btn"
                        style={{ marginTop: 8, fontSize: 12 }}
                        onClick={() => setQOptions([...qOptions, ""])}
                      >
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {qType === "text" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                      Accepted Answers (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={qAccepted}
                      onChange={(e) => setQAccepted(e.target.value)}
                      placeholder="e.g. Paris, paris, city of light"
                      style={{ width: "100%", padding: "8px 12px", boxSizing: "border-box" }}
                    />
                  </div>
                )}

                <div>
                  <button type="submit" className="btn btn-solid">
                    Add Question
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
