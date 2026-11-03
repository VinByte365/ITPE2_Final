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
import QuestionImport from "../../components/QuestionImport";

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
    <div className="page-shell qb-page">
      <div className="qb-back">
        <Link className="back-link" to={`/faculty/topics/${topicId}`}>
          ← Back to topic editor
        </Link>
      </div>

      <div className="qb-head">
        <h1>Quiz Configuration</h1>
        {quiz && (
          <div className="qb-head-actions">
            <span className={`qb-status ${quiz.status === "published" ? "qb-status-published" : "qb-status-draft"}`}>
              {quiz.status.toUpperCase()}
            </span>
            <button type="button" className="btn btn-solid" onClick={handlePublish}>
              {quiz.status === "published" ? "Unpublish to Draft" : "Publish Quiz"}
            </button>
          </div>
        )}
      </div>

      {error && <div className="auth-error" role="alert">{error}</div>}
      {success && <div className="qb-success">{success}</div>}

      {/* Meta Editor */}
      <div className="qb-panel">
        <h2>General Settings</h2>

        <div className="qb-stack">
          <div>
            <label className="qb-label">
              Quiz Title
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="qb-label">
              Delivery Mode
            </label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="input"
            >
              <option value="built">Built-in Interactive Quiz (Questions auto-graded)</option>
              <option value="uploaded">Uploaded Quiz (Student submits image, faculty grades)</option>
            </select>
          </div>

          <div>
            <label className="qb-label">
              Instructions / Description
            </label>
            <textarea
              className="input"
              rows={3}
              placeholder="Guidelines or instructions for students..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div className="qb-grid">
            {mode === "uploaded" && (
              <div>
                <label className="qb-label">
                  Total Items / Maximum Score *
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  className="input"
                  value={totalItems}
                  onChange={(e) => setTotalItems(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="qb-label">
                Max Attempts (leave blank for unlimited)
              </label>
              <input
                type="number"
                min={1}
                className="input"
                placeholder="Unlimited"
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(e.target.value)}
              />
            </div>
          </div>

          {mode === "uploaded" && (
            <div className="qb-stack-tight">
              <div>
                <label className="qb-label">
                  External Quiz Link (Optional)
                </label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://forms.google.com/..."
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="qb-label">
                  Quiz Attachment (PDF, PPTX, Text or Image ≤ 25 MB)
                </label>
                {attachment && (
                  <p className="qb-note-ok">
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
                  <p className="qb-muted-note">
                    Create quiz first to attach a file.
                  </p>
                )}
                {uploadingAttachment && (
                  <span className="qb-uploading">Uploading...</span>
                )}
              </div>
            </div>
          )}

          {mode === "built" && (
            <div>
              <label className="qb-check">
                <input
                  type="checkbox"
                  checked={showAnswers}
                  onChange={(e) => setShowAnswers(e.target.checked)}
                />
                <span className="qb-check-label">
                  Show answer review to students after submission
                </span>
              </label>
            </div>
          )}

          <div className="qb-actions">
            {!quiz ? (
              <button type="button" className="btn btn-solid" onClick={handleCreateQuiz}>
                Create Quiz
              </button>
            ) : (
              <>
                <button type="button" className="btn btn-solid" onClick={handleSaveMeta}>
                  Save Settings
                </button>
                {quiz.mode === "built" && (
                  <button type="button" className="btn" onClick={handleRegrade}>
                    Regrade All Attempts
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Built-in Mode: Question Builder */}
      {quiz && quiz.mode === "built" && (
        <div className="qb-panel">
          <div className="qb-head-row">
            <h2>Questions ({questions.length} / 20)</h2>
            <span className={`qb-count ${questions.length >= 10 ? "qb-count-ready" : "qb-count-pending"}`}>
              {questions.length >= 10 ? "✓ Ready to publish" : "Needs at least 10 questions to publish"}
            </span>
          </div>

          <ul className="qb-list">
            {questions.map((q, idx) => (
              <li key={q.id} className="qb-question">
                <div>
                  <strong className="qb-question-prompt">{idx + 1}.</strong>
                  <span>{q.prompt}</span>
                  <span className="qb-question-meta">
                    ({q.type}, {q.points} {q.points === 1 ? "pt" : "pts"})
                  </span>
                </div>
                <button
                  type="button"
                  className="btn qb-delete"
                  onClick={() => handleDeleteQuestion(q.id)}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

          {questions.length < 20 && (
            <form onSubmit={handleAddQuestion} className="qb-add-form">
              <h3>Add New Question</h3>

              <div className="qb-add-stack">
                <div className="qb-add-grid">
                  <div>
                    <label className="qb-add-label">Type</label>
                    <select
                      className="input"
                      value={qType}
                      onChange={(e) => setQType(e.target.value)}
                    >
                      <option value="choice">Multiple Choice</option>
                      <option value="text">Short Text</option>
                    </select>
                  </div>
                  <div>
                    <label className="qb-add-label">Points</label>
                    <input type="number" min={1} className="input" value={qPoints} onChange={(e) => setQPoints(e.target.value)} />
                  </div>
                </div>

                <div>
                  <label className="qb-add-label">Question Prompt</label>
                  <input type="text" className="input" value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} placeholder="Enter question text..." required />
                </div>

                {qType === "choice" && (
                  <div>
                    <label className="qb-add-label">
                      Options (Select the correct option)
                    </label>
                    <div className="qb-options">
                      {qOptions.map((opt, i) => (
                        <div key={i} className="qb-option-row">
                          <input
                            type="radio"
                            name="correctOpt"
                            checked={qCorrect === i}
                            onChange={() => setQCorrect(i)}
                          />
                          <input
                            type="text"
                            className="input"
                            value={opt}
                            onChange={(e) => {
                              const n = [...qOptions];
                              n[i] = e.target.value;
                              setQOptions(n);
                            }}
                            placeholder={`Option ${i + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                    {qOptions.length < 6 && (
                      <button type="button" className="btn" onClick={() => setQOptions([...qOptions, ""])}>
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {qType === "text" && (
                  <div>
                    <label className="qb-add-label">
                      Accepted Answers (comma-separated)
                    </label>
                    <input type="text" className="input" value={qAccepted} onChange={(e) => setQAccepted(e.target.value)} placeholder="e.g. Paris, paris, city of light" />
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
      {quiz && quiz.mode === "built" && (
        <QuestionImport quizId={quiz.id} onImported={load} />
      )}
    </div>
  );
}
