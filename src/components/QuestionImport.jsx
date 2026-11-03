import { useState } from "react";
import Papa from "papaparse";
import { importQuestions } from "../api/quizzes";

function rowToQuestion(row) {
  const type = (row.type || "").trim().toLowerCase();
  if (type === "choice") {
    const options = ["A", "B", "C", "D", "E", "F"]
      .map((l) => row[`option${l}`])
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
      .map((label) => ({ label: String(label).trim() }));
    const correctLetter = String(row.correct || "").trim().toUpperCase();
    const correctIndex = "ABCDEF".indexOf(correctLetter);
    return {
      type: "choice",
      prompt: String(row.question || "").trim(),
      options,
      correctOptionIndex: correctIndex >= 0 ? correctIndex : 0,
      points: Number(row.points) > 0 ? Number(row.points) : 1,
    };
  }
  if (type === "text") {
    const accepted = String(row.acceptedAnswers || "")
      .split("|")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      type: "text",
      prompt: String(row.question || "").trim(),
      acceptedAnswers: accepted.length ? accepted : [String(row.acceptedAnswers || "").trim()],
      points: Number(row.points) > 0 ? Number(row.points) : 1,
    };
  }
  return { type, prompt: String(row.question || "").trim() };
}

export default function QuestionImport({ quizId, onImported }) {
  const [questions, setQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = (result.data || []).map(rowToQuestion);
        setQuestions(parsed);
        // basic validation: prompt required
        const errs = [];
        parsed.forEach((q, i) => {
          if (!q.prompt) errs.push(`Row ${i + 1}: prompt required`);
          if (q.type === "choice" && (!q.options || q.options.length < 2)) errs.push(`Row ${i + 1}: need >=2 options`);
          if (q.type === "text" && (!q.acceptedAnswers || q.acceptedAnswers.length === 0)) errs.push(`Row ${i + 1}: need accepted answer`);
        });
        setErrors(errs);
      },
      error: (err) => setError(err?.message || "Parse failed."),
    });
  };

  const handleConfirm = async () => {
    if (errors.length > 0) return;
    setImporting(true);
    try {
      await importQuestions(quizId, questions);
      onImported?.();
      setQuestions([]); setErrors([]);
    } catch (err) { setError(err?.message || "Import failed."); }
    finally { setImporting(false); }
  };

  return (
    <div style={{ marginTop: 12, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
      <h3>Import questions from CSV</h3>
      <input type="file" accept=".csv" onChange={handleFile} />
      <p><a href="/question-template.csv" download>Download template</a></p>
      {error && <div className="auth-error" role="alert">{error}</div>}
      {errors.length > 0 && (
        <ul style={{ color: "#991b1b" }}>
          {errors.map((e, i) => <li key={i}>{e}</li>)}
        </ul>
      )}
      {questions.length > 0 && (
        <>
          <p>{questions.length} questions parsed.</p>
          <table style={{ width: "100%", fontSize: 12 }}>
            <thead><tr><th>#</th><th>Type</th><th>Prompt</th></tr></thead>
            <tbody>
              {questions.map((q, i) => (
                <tr key={i}><td>{i + 1}</td><td>{q.type}</td><td>{q.prompt}</td></tr>
              ))}
            </tbody>
          </table>
          <button className="button" onClick={handleConfirm} disabled={importing || errors.length > 0}>
            {importing ? "Importing..." : "Confirm import"}
          </button>
        </>
      )}
    </div>
  );
}