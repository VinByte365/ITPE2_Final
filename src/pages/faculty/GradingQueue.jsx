import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  listFacultySubmissions,
  getFacultyAttemptDetail,
  gradeFacultyAttempt,
} from "../../api/quizzes";
import { getSubject } from "../../api/subjects";
import ImageViewer from "../../components/ImageViewer";
import StatusBadge from "../../components/StatusBadge";

export default function GradingQueue() {
  const { id: subjectId } = useParams();
  const [subject, setSubject] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadSubmissions = async (keepSelection = true) => {
    try {
      const subs = await listFacultySubmissions(subjectId, {
        status: statusFilter === "all" ? undefined : statusFilter,
        q: searchTerm || undefined,
      });
      setSubmissions(Array.isArray(subs) ? subs : []);

      if (keepSelection && selectedAttemptId) {
        // reload current detail
        try {
          const d = await getFacultyAttemptDetail(selectedAttemptId);
          setDetail(d);
          setScore(d?.attempt?.score !== null ? String(d.attempt.score) : "");
          setFeedback(d?.attempt?.feedback || "");
        } catch {}
      } else if (subs?.length > 0) {
        // select first pending
        const first = subs[0];
        setSelectedAttemptId(first.id);
        const d = await getFacultyAttemptDetail(first.id);
        setDetail(d);
        setScore(d?.attempt?.score !== null ? String(d.attempt.score) : "");
        setFeedback(d?.attempt?.feedback || "");
      } else {
        setSelectedAttemptId(null);
        setDetail(null);
      }
    } catch (err) {
      setError(err?.message || "Failed to load submissions.");
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const s = await getSubject(subjectId);
        setSubject(s);
      } catch {}
      await loadSubmissions(false);
      setLoading(false);
    })();
  }, [subjectId, statusFilter]);

  const handleSelectSubmission = async (attId) => {
    setSelectedAttemptId(attId);
    setError("");
    setSuccess("");
    try {
      const d = await getFacultyAttemptDetail(attId);
      setDetail(d);
      setScore(d?.attempt?.score !== null ? String(d.attempt.score) : "");
      setFeedback(d?.attempt?.feedback || "");
    } catch (err) {
      setError(err?.message || "Failed to load submission details.");
    }
  };

  const handleSaveGrade = async (andNext = false) => {
    if (!detail) return;
    const total = detail.totalItems;
    const num = Number(score);

    if (score === "" || isNaN(num) || num < 0 || num > total) {
      setError(`Score must be a number between 0 and ${total}.`);
      return;
    }

    if (Math.round(num * 100) / 100 !== num) {
      setError("Score can have at most 2 decimal places.");
      return;
    }

    setGrading(true);
    setError("");
    setSuccess("");

    try {
      await gradeFacultyAttempt(detail.attempt.id, {
        score: num,
        feedback: feedback || null,
      });
      setSuccess("Grade saved successfully.");

      // Refresh list
      const updatedSubs = await listFacultySubmissions(subjectId, {
        status: statusFilter === "all" ? undefined : statusFilter,
        q: searchTerm || undefined,
      });
      setSubmissions(Array.isArray(updatedSubs) ? updatedSubs : []);

      if (andNext) {
        // Find next item in current list
        const currentIndex = updatedSubs.findIndex((s) => s.id === detail.attempt.id);
        const nextSub = updatedSubs[currentIndex + 1] || updatedSubs[0];
        if (nextSub && nextSub.id !== detail.attempt.id) {
          await handleSelectSubmission(nextSub.id);
        } else {
          setSuccess("Grade saved! Queue complete.");
        }
      } else {
        // Reload current detail
        const d = await getFacultyAttemptDetail(detail.attempt.id);
        setDetail(d);
      }
    } catch (err) {
      setError(err?.message || "Failed to save grade.");
    } finally {
      setGrading(false);
    }
  };

  const pendingCount = submissions.filter((s) => s.status === "pending_review").length;

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading grading queue...</p>
      </div>
    );
  }

  return (
    <div className="page-shell" style={{ maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <Link
          to={`/faculty/subjects/${subjectId}/topics`}
          style={{ fontSize: 14, textDecoration: "none", color: "#4f46e5" }}
        >
          ← Back to topics
        </Link>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ margin: "0 0 4px" }}>Grading Queue</h1>
          <p style={{ margin: 0, fontSize: 14, color: "#6b7280" }}>
            {subject?.name} ({subject?.code}) · Passing: {subject?.passingPercent}%
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 600,
              background: pendingCount > 0 ? "#fef3c7" : "#d1fae5",
              color: pendingCount > 0 ? "#92400e" : "#065f46",
            }}
          >
            {pendingCount} Pending Review
          </span>
        </div>
      </div>

      {error && <div className="auth-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div style={{ padding: 12, background: "#ecfdf5", color: "#065f46", borderRadius: 6, marginBottom: 16 }}>{success}</div>}

      {/* Filter and Search Bar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className={`button ${statusFilter === "pending_review" ? "button-primary" : ""}`}
            style={{ fontSize: 13, padding: "6px 12px" }}
            onClick={() => setStatusFilter("pending_review")}
          >
            Pending Review
          </button>
          <button
            type="button"
            className={`button ${statusFilter === "graded" ? "button-primary" : ""}`}
            style={{ fontSize: 13, padding: "6px 12px" }}
            onClick={() => setStatusFilter("graded")}
          >
            Graded
          </button>
          <button
            type="button"
            className={`button ${statusFilter === "all" ? "button-primary" : ""}`}
            style={{ fontSize: 13, padding: "6px 12px" }}
            onClick={() => setStatusFilter("all")}
          >
            All Submissions
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadSubmissions(false);
          }}
          style={{ display: "flex", gap: 8, flex: 1, minWidth: 200 }}
        >
          <input
            type="text"
            className="input"
            placeholder="Search by student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}
          />
          <button type="submit" className="button" style={{ fontSize: 13, padding: "6px 12px" }}>
            Search
          </button>
        </form>
      </div>

      {/* Two-column layout: Queue List and Grading Detail */}
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20, alignItems: "start" }}>
        {/* Left column: Submissions list */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            background: "#fff",
            maxHeight: 650,
            overflowY: "auto",
          }}
        >
          {submissions.length === 0 ? (
            <p style={{ padding: 20, textAlign: "center", color: "#6b7280", margin: 0 }}>
              No submissions match this filter.
            </p>
          ) : (
            submissions.map((sub) => {
              const isSelected = sub.id === selectedAttemptId;
              return (
                <div
                  key={sub.id}
                  onClick={() => handleSelectSubmission(sub.id)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #f3f4f6",
                    cursor: "pointer",
                    background: isSelected ? "#eff6ff" : "transparent",
                    borderLeft: isSelected ? "4px solid #4f46e5" : "4px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                    <strong style={{ fontSize: 14 }}>
                      {sub.student?.lastName}, {sub.student?.firstName}
                    </strong>
                    <StatusBadge status={sub.status} />
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>
                    {sub.student?.studentNumber} · {sub.topic?.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "Date unknown"}
                    {sub.score !== null && (
                      <span style={{ marginLeft: 8, fontWeight: 600, color: "#111827" }}>
                        Score: {sub.score}/{sub.total}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right column: Image preview & grading panel */}
        {detail ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 8, background: "#fff", padding: 20 }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: "0 0 4px" }}>
                  {detail.student?.lastName}, {detail.student?.firstName}
                </h2>
                <p style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>
                  ID: {detail.student?.studentNumber} · Quiz: {detail.quiz?.title} ({detail.topic?.title})
                </p>
              </div>
              <StatusBadge status={detail.attempt?.status} />
            </div>

            {/* Image Viewer */}
            <div style={{ marginBottom: 20 }}>
              <ImageViewer src={detail.imageUrl} alt="Student submission score proof" />
            </div>

            {/* Grading Form */}
            <div
              style={{
                padding: 16,
                background: "#f9fafb",
                borderRadius: 8,
                border: "1px solid #e5e7eb",
              }}
            >
              <h3 style={{ fontSize: 15, marginTop: 0, marginBottom: 12 }}>Enter Score</h3>

              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, marginBottom: 12 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Score (out of {detail.totalItems}) *
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={detail.totalItems}
                      className="input"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder={`0 - ${detail.totalItems}`}
                      style={{ width: "100%", padding: "8px 10px" }}
                      required
                    />
                    <span style={{ fontSize: 14, color: "#6b7280" }}>/ {detail.totalItems}</span>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                    Optional Feedback for Student
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="e.g. Great job on the quiz!"
                    style={{ width: "100%", padding: "8px 10px" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                <button
                  type="button"
                  className="button button-primary"
                  onClick={() => handleSaveGrade(false)}
                  disabled={grading}
                >
                  {grading ? "Saving..." : "Save Grade"}
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={() => handleSaveGrade(true)}
                  disabled={grading}
                >
                  Save and Next →
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: 40, textAlign: "center", border: "1px dashed #d1d5db", borderRadius: 8, color: "#6b7280" }}>
            Select a submission from the list on the left to review and grade.
          </div>
        )}
      </div>
    </div>
  );
}

