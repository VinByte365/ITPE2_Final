import { useState, useEffect } from "react";
import {
  getStudentUploadUrl,
  submitQuizImage,
  deletePendingAttempt,
  getAttemptImageUrl,
  getAttemptHistory,
} from "../api/quizzes";
import { uploadToSignedUrl } from "../api/client";
import StatusBadge from "./StatusBadge";

// Downscale & JPEG re-encode if image is large
async function processImageFile(file) {
  return new Promise((resolve) => {
    // If not image or small enough, return as-is
    if (!file.type.startsWith("image/")) return resolve(file);

    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1920;
      let width = img.width;
      let height = img.height;

      // Check if resizing needed
      if (width <= maxDim && height <= maxDim && file.size <= 2 * 1024 * 1024) {
        return resolve(file);
      }

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressed);
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export default function UploadSubmission({ quiz, topicId, onStatusChange }) {
  const [history, setHistory] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [serverImageUrl, setServerImageUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const pendingAttempt = history?.attempts?.find((a) => a.status === "pending_review");
  const latestGraded = history?.attempts?.slice().reverse().find((a) => a.status === "graded");

  const loadHistory = async () => {
    try {
      const h = await getAttemptHistory(quiz.id);
      setHistory(h);
      const pending = h?.attempts?.find((a) => a.status === "pending_review");
      if (pending) {
        try {
          const { url } = await getAttemptImageUrl(pending.id);
          setServerImageUrl(url);
        } catch {}
      } else if (latestGraded) {
        try {
          const { url } = await getAttemptImageUrl(latestGraded.id);
          setServerImageUrl(url);
        } catch {}
      }
    } catch {}
  };

  useEffect(() => {
    if (quiz?.id) loadHistory();
  }, [quiz?.id]);

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type and size client-side first
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setError("Only JPG, PNG, and WebP images are accepted.");
      return;
    }

    setError("");
    setSuccess("");

    const processed = await processImageFile(file);
    if (processed.size > 5 * 1024 * 1024) {
      setError("Image exceeds the 5 MB limit even after optimization.");
      return;
    }

    setSelectedFile(processed);
    setPreviewUrl(URL.createObjectURL(processed));
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setSubmitting(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    try {
      // 1. Get signed upload URL
      const { uploadUrl, path } = await getStudentUploadUrl(quiz.id, {
        fileName: selectedFile.name,
        mime: selectedFile.type,
        size: selectedFile.size,
      });

      // 2. Upload with progress
      await uploadToSignedUrl(uploadUrl, selectedFile, (pct) => setUploadProgress(pct));

      // 3. Create submission
      await submitQuizImage(quiz.id, path);

      setSuccess("Submission received! It is now pending instructor grading.");
      setSelectedFile(null);
      setPreviewUrl(null);
      setUploadProgress(null);
      await loadHistory();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      if (err?.code === "PENDING_REVIEW_EXISTS") {
        setError("You already have a submission pending review. Replace or delete it first.");
      } else if (err?.code === "MAX_ATTEMPTS_REACHED") {
        setError("Maximum submission attempts reached for this quiz.");
      } else {
        setError(err?.message || "Failed to submit image.");
      }
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  };

  const handleDeletePending = async () => {
    if (!pendingAttempt) return;
    if (!window.confirm("Remove this pending submission so you can upload a new one?")) return;
    setSubmitting(true);
    setError("");
    try {
      await deletePendingAttempt(pendingAttempt.id);
      setSuccess("Pending submission removed.");
      setServerImageUrl(null);
      await loadHistory();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      setError(err?.message || "Failed to remove submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: 20, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 12 }}>
        Quiz: {quiz.title} (Manual Submission)
      </h2>

      {/* Instructions & Links */}
      {quiz.instructions && (
        <div style={{ fontSize: 14, color: "#374151", marginBottom: 14, lineHeight: 1.5 }}>
          {quiz.instructions}
        </div>
      )}

      {(quiz.externalUrl || quiz.attachmentPath) && (
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16, padding: "10px 14px", background: "#f8fafc", borderRadius: 6 }}>
          {quiz.externalUrl && (
            <a
              href={quiz.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, color: "#4f46e5", textDecoration: "none" }}
            >
              🔗 Open Quiz Assignment Link ↗
            </a>
          )}
          {quiz.attachmentPath && (
            <span style={{ fontSize: 13, color: "#4b5563" }}>
              📎 Attachment: <strong>{quiz.attachmentName || "Quiz Document"}</strong>
            </span>
          )}
        </div>
      )}

      {error && <div className="auth-error" role="alert" style={{ marginBottom: 12 }}>{error}</div>}
      {success && <div style={{ padding: 10, background: "#ecfdf5", color: "#065f46", borderRadius: 6, marginBottom: 12 }}>{success}</div>}

      {/* Current State / History */}
      {pendingAttempt ? (
        <div style={{ padding: 16, background: "#fef9c3", border: "1px solid #fde047", borderRadius: 8, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: "#854d0e" }}>
              ⏳ Submission Pending Review
            </span>
            <button
              type="button"
              className="button"
              style={{ fontSize: 12, padding: "4px 8px" }}
              onClick={handleDeletePending}
              disabled={submitting}
            >
              Remove / Replace Submission
            </button>
          </div>
          <p style={{ fontSize: 13, color: "#713f12", margin: "0 0 10px" }}>
            Submitted at: {new Date(pendingAttempt.submittedAt || pendingAttempt.startedAt).toLocaleString()}
          </p>
          {serverImageUrl && (
            <div>
              <p style={{ fontSize: 12, color: "#713f12", marginBottom: 4 }}>Uploaded Score Proof:</p>
              <img
                src={serverImageUrl}
                alt="Submitted proof"
                style={{ maxHeight: 200, maxWidth: "100%", borderRadius: 6, border: "1px solid #e5e7eb" }}
              />
            </div>
          )}
        </div>
      ) : latestGraded ? (
        <div style={{ padding: 16, background: latestGraded.score / latestGraded.total >= (history?.passingPercent || 75) / 100 ? "#ecfdf5" : "#fef2f2", borderRadius: 8, marginBottom: 16, border: "1px solid rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 16, fontWeight: 700 }}>
              Grade: {latestGraded.score} / {latestGraded.total}
            </span>
            <StatusBadge status={history?.passed ? "completed" : "failed"} />
          </div>
          {latestGraded.feedback && (
            <p style={{ fontSize: 14, color: "#374151", margin: "6px 0" }}>
              <strong>Instructor Feedback:</strong> {latestGraded.feedback}
            </p>
          )}
          <p style={{ fontSize: 12, color: "#6b7280", margin: "4px 0 0" }}>
            Graded on: {new Date(latestGraded.gradedAt).toLocaleString()}
          </p>
        </div>
      ) : null}

      {/* Upload New Submission Form (only when no pending submission) */}
      {!pendingAttempt && (
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "block", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
            Upload Score Screenshot / Photo (JPG, PNG, WebP ≤ 5 MB)
          </label>

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            capture="environment"
            onChange={handleFileSelect}
            disabled={submitting}
            style={{ marginBottom: 12 }}
          />

          {previewUrl && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Preview:</p>
              <img
                src={previewUrl}
                alt="Preview"
                style={{ maxHeight: 240, maxWidth: "100%", borderRadius: 6, border: "1px solid #d1d5db" }}
              />
            </div>
          )}

          {uploadProgress !== null && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ height: 8, width: "100%", background: "#e5e7eb", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${uploadProgress}%`, background: "#4f46e5", transition: "width 0.2s" }} />
              </div>
              <span style={{ fontSize: 12, color: "#4f46e5" }}>Uploading: {uploadProgress}%</span>
            </div>
          )}

          {selectedFile && (
            <div>
              <button
                type="button"
                className="button button-primary"
                onClick={handleUploadSubmit}
                disabled={submitting}
              >
                {submitting ? "Uploading..." : "Submit for Grading"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

