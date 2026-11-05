import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getFacultyQuiz,
  upsertQuizMeta,
  updateQuizStatus,
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  regradeQuiz,
  getQuizAttachmentUploadUrl,
} from "../../api/quizzes";
import { uploadToSignedUrl } from "../../api/client";
import QuestionImport from "../../components/QuestionImport";
import StatusBadge from "../../components/StatusBadge";
import { CheckIcon } from "../../components/Icons";

function defaultChoiceOptions() {
  return ["", "", "", ""];
}

function isDefaultOptionLabel(label, index) {
  if (!label) return true;
  const n = index + 1;
  const letter = String.fromCharCode(65 + index);
  return label === `Option ${n}` || label === `Option ${letter}`;
}

function isDefaultPrompt(prompt) {
  return !prompt || prompt === "Untitled question";
}

function questionToForm(q) {
  if (q.type === "choice") {
    const opts = (q.options || []).map((o, i) => {
      const label = o?.label ?? "";
      return isDefaultOptionLabel(label, i) ? "" : label;
    });
    while (opts.length < 4) opts.push("");
    return {
      id: q.id,
      type: "choice",
      prompt: isDefaultPrompt(q.prompt) ? "" : (q.prompt || ""),
      options: opts.slice(0, 4),
      correctOptionIndex: Math.max(0, Math.min(3, (q.options || []).findIndex((o) => o.id === q.correctOptionId))),
      points: q.points ?? 1,
      saving: false,
      saved: false,
    };
  }
  return {
    id: q.id,
    type: "text",
    prompt: isDefaultPrompt(q.prompt) ? "" : (q.prompt || ""),
    options: defaultChoiceOptions(),
    correctOptionIndex: 0,
    acceptedAnswers: (q.acceptedAnswers || []).join(", "),
    points: q.points ?? 1,
    saving: false,
    saved: false,
  };
}

export default function QuizBuilder() {
  const { id: topicId } = useParams();
  const [quiz, setQuiz] = useState(null);
  const [questionForms, setQuestionForms] = useState([]);
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

  const saveTimers = useRef({});

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
          setQuestionForms(Array.isArray(qs) ? qs.map(questionToForm) : []);
        } else {
          setQuestionForms([]);
        }
      } else {
        setQuestionForms([]);
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

  useEffect(() => () => {
    Object.values(saveTimers.current).forEach(clearTimeout);
  }, []);

  const scheduleSave = (id, buildPayload) => {
    if (saveTimers.current[id]) clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = setTimeout(async () => {
      const form = questionFormsRef.current.find((f) => f.id === id);
      if (!form) return;
      try {
        setQuestionForms((prev) => prev.map((f) => (f.id === id ? { ...f, saving: true, saved: false } : f)));
        await updateQuestion(id, buildPayload(form));
        setQuestionForms((prev) => prev.map((f) => (f.id === id ? { ...f, saving: false, saved: true } : f)));
        setTimeout(() => {
          setQuestionForms((prev) => prev.map((f) => (f.id === id ? { ...f, saved: false } : f)));
        }, 1200);
      } catch (err) {
        setQuestionForms((prev) => prev.map((f) => (f.id === id ? { ...f, saving: false } : f)));
        setError(err?.message || "Auto-save failed.");
      }
    }, 600);
  };

  const questionFormsRef = useRef(questionForms);
  questionFormsRef.current = questionForms;

  const updateForm = (id, patch) => {
    setQuestionForms((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const buildPayload = (form) => {
    if (form.type === "choice") {
      return {
        prompt: String(form.prompt || "").trim() || "Untitled question",
        options: (form.options || []).slice(0, 4).map((label, i) => ({
          label: String(label || "").trim() || `Option ${String.fromCharCode(65 + i)}`,
        })),
        correctOptionIndex: Math.max(0, Math.min(3, Number(form.correctOptionIndex) || 0)),
        points: Number(form.points) || 1,
      };
    }
    return {
      prompt: String(form.prompt || "").trim() || "Untitled question",
      acceptedAnswers: String(form.acceptedAnswers || "").split(",").map((s) => s.trim()).filter(Boolean),
      points: Number(form.points) || 1,
    };
  };

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

  const handleAddQuestion = async () => {
    if (!quiz) return;
    setError("");
    try {
      const created = await createQuestion(quiz.id, {
        type: "choice",
        prompt: "Untitled question",
        options: [{ label: "Option A" }, { label: "Option B" }, { label: "Option C" }, { label: "Option D" }],
        correctOptionIndex: 0,
        points: 1,
      });
      setQuestionForms((prev) => [...prev, questionToForm(created)]);
    } catch (err) {
      setError(err?.message || "Add question failed.");
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm("Delete this question?")) return;
    setError("");
    try {
      await deleteQuestion(id);
      setQuestionForms((prev) => prev.filter((f) => f.id !== id));
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

  if (loading) {
    return (
      <div className="page-shell qb-page">
        <p className="sr-only" role="status">Loading quiz…</p>
        <div className="qb-skeleton" aria-hidden="true">
          <span className="skeleton-line qb-skeleton-title" />
          <div className="qb-skeleton-panel">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="skeleton-line" />
            ))}
          </div>
          <div className="qb-skeleton-panel">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className="skeleton-line" />
            ))}
          </div>
        </div>
      </div>
    );
  }

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
            <StatusBadge status={quiz.status} />
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
            <label className="qb-label">Quiz Title</label>
            <input type="text" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <label className="qb-label">Delivery Mode</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)} className="input">
              <option value="built">Built-in Interactive Quiz (Questions auto-graded)</option>
              <option value="uploaded">Uploaded Quiz (Student submits image, faculty grades)</option>
            </select>
          </div>

          <div>
            <label className="qb-label">Instructions / Description</label>
            <textarea className="input" rows={3} placeholder="Guidelines or instructions for students..." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
          </div>

          <div className="qb-grid">
            {mode === "uploaded" && (
              <div>
                <label className="qb-label">Total Items / Maximum Score *</label>
                <input type="number" min={1} max={1000} className="input" value={totalItems} onChange={(e) => setTotalItems(e.target.value)} required />
              </div>
            )}

            <div>
              <label className="qb-label">Max Attempts (leave blank for unlimited)</label>
              <input type="number" min={1} className="input" placeholder="Unlimited" value={maxAttempts} onChange={(e) => setMaxAttempts(e.target.value)} />
            </div>
          </div>

          {mode === "uploaded" && (
            <div className="qb-stack-tight">
              <div>
                <label className="qb-label">External Quiz Link (Optional)</label>
                <input type="url" className="input" placeholder="https://forms.google.com/..." value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} />
              </div>

              <div>
                <label className="qb-label">Quiz Attachment (PDF, PPTX, Text or Image ≤ 25 MB)</label>
                {attachment && <p className="qb-note-ok">Current attachment: <strong>{attachment.name}</strong></p>}
                {quiz ? (
                  <input type="file" accept=".pdf,.pptx,.txt,.jpg,.jpeg,.png,.webp" onChange={handleAttachmentUpload} disabled={uploadingAttachment} />
                ) : (
                  <p className="qb-muted-note">Create quiz first to attach a file.</p>
                )}
                {uploadingAttachment && <span className="qb-uploading">Uploading...</span>}
              </div>
            </div>
          )}

          {mode === "built" && (
            <div>
              <label className="qb-check">
                <input type="checkbox" checked={showAnswers} onChange={(e) => setShowAnswers(e.target.checked)} />
                <span className="qb-check-label">Show answer review to students after submission</span>
              </label>
            </div>
          )}

          <div className="qb-actions">
            {!quiz ? (
              <button type="button" className="btn btn-solid" onClick={handleCreateQuiz}>Create Quiz</button>
            ) : (
              <>
                <button type="button" className="btn btn-solid" onClick={handleSaveMeta}>Save Settings</button>
                {quiz.mode === "built" && (
                  <button type="button" className="btn" onClick={handleRegrade}>Regrade All Attempts</button>
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
            <h2>Questions ({questionForms.length} / 20)</h2>
            <span className={`qb-count ${questionForms.length >= 10 ? "qb-count-ready" : "qb-count-pending"}`}>
              {questionForms.length >= 10 ? (
                <>
                  <CheckIcon /> Ready to publish
                </>
              ) : (
                "Needs at least 10 questions to publish"
              )}
            </span>
          </div>

          {questionForms.length === 0 && (
            <div className="empty-state">
              No questions yet. Add the first question below, or import a question set.
            </div>
          )}

          <div className="qb-forms">
            {questionForms.map((form, idx) => (
              <div key={form.id} className="qb-form-card">
                <div className="qb-form-head">
                  <span className="qb-form-index">{idx + 1}</span>
                  <span className="qb-form-type qb-form-type-static">Multiple Choice</span>
                  <input
                    type="number"
                    min={1}
                    className="input qb-form-points"
                    value={form.points}
                    onChange={(e) => {
                      updateForm(form.id, { points: e.target.value });
                      scheduleSave(form.id, buildPayload);
                    }}
                    aria-label="Points"
                  />
                  <span className="qb-form-save">{form.saving ? "Saving…" : form.saved ? "Saved" : ""}</span>
                  <button type="button" className="btn qb-delete" onClick={() => handleDeleteQuestion(form.id)}>Delete</button>
                </div>

                <div className="qb-form-body">
                  <input
                    type="text"
                    className="input qb-form-prompt"
                    value={form.prompt}
                    onChange={(e) => {
                      updateForm(form.id, { prompt: e.target.value });
                      scheduleSave(form.id, buildPayload);
                    }}
                    placeholder="Question"
                  />

                  {form.type === "choice" && (
                    <div className="qb-options">
                      {(form.options || []).slice(0, 4).map((opt, i) => (
                        <label key={i} className="qb-option-row">
                          <input
                            type="radio"
                            name={`correct-${form.id}`}
                            checked={Number(form.correctOptionIndex) === i}
                            onChange={() => {
                              updateForm(form.id, { correctOptionIndex: i });
                              scheduleSave(form.id, buildPayload);
                            }}
                          />
                          <input
                            type="text"
                            className="input"
                            value={opt}
                            onChange={(e) => {
                              const n = [...(form.options || defaultChoiceOptions())];
                              n[i] = e.target.value;
                              updateForm(form.id, { options: n });
                              scheduleSave(form.id, buildPayload);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                          />
                        </label>
                      ))}
                    </div>
                  )}

                  {form.type === "text" && (
                    <div>
                      <label className="qb-add-label">Accepted Answers (comma-separated)</label>
                      <input
                        type="text"
                        className="input"
                        value={form.acceptedAnswers}
                        onChange={(e) => {
                          updateForm(form.id, { acceptedAnswers: e.target.value });
                          scheduleSave(form.id, buildPayload);
                        }}
                        placeholder="e.g. Paris, paris"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {questionForms.length < 20 && (
            <div className="qb-add-row">
              <button type="button" className="btn btn-solid" onClick={handleAddQuestion}>+ Add question</button>
            </div>
          )}
        </div>
      )}
      {quiz && quiz.mode === "built" && (
        <QuestionImport quizId={quiz.id} onImported={load} />
      )}
    </div>
  );
}
