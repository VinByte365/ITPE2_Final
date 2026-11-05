// src/pages/faculty/StudentScores.jsx
// RPT-10: Per-student summary page for faculty. All quizzes and attempts for
// one student; Print, PDF and Excel buttons reuse the exporters.
import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getStudentScores } from '../../api/subjects';
import { exportPdf } from '../../lib/exportPdf';
import { exportXlsx } from '../../lib/exportXlsx';
import { exportCsv } from '../../lib/exportCsv';
import StatusBadge from '../../components/StatusBadge';

export default function StudentScores() {
  const { id: subjectId, studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [passingPercent, setPassingPercent] = useState(75);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const d = await getStudentScores(subjectId, studentId);
      if (!d) throw new Error('No scores returned.');
      setData(d);
      setPassingPercent(d.subject?.passingPercent ?? 75);
    } catch (err) {
      setError(err?.message || 'Failed to load student scores.');
    } finally {
      setLoading(false);
    }
  }, [subjectId, studentId]);

  const handleDownloadPdf = async () => {
    if (!reportLike) return;
    try {
      await exportPdf(reportLike, {
        passingPercent,
        columns: data.quizzes.map((q) => `quiz-${q.quizId}`),
      });
    } catch (err) {
      setError(err?.message || 'Failed to generate PDF.');
    }
  };

  const handleDownloadExcel = async () => {
    if (!reportLike) return;
    try {
      await exportXlsx(reportLike, {
        passingPercent,
        columns: data.quizzes.map((q) => `quiz-${q.quizId}`),
      });
    } catch (err) {
      setError(err?.message || 'Failed to generate Excel.');
    }
  };

  const handleDownloadCsv = () => {
    if (!reportLike) return;
    try {
      exportCsv(reportLike, {
        passingPercent,
        columns: data.quizzes.map((q) => `quiz-${q.quizId}`),
      });
    } catch (err) {
      setError(err?.message || 'Failed to generate CSV.');
    }
  };

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading student scores…</p>
      </div>
    );
  }

  const { subject, student, quizzes } = data ?? {};
  const reportLike = buildReportLike({ subject, student, quizzes });

  if (loading) {
    return (
      <div className="page-shell">
        <p>Loading student scores…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <div className="auth-error" role="alert">{error}</div>
        <button type="button" className="btn btn-solid" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="page-shell">
        <h1>Student scores</h1>
        <p>No scores available.</p>
        <button type="button" className="btn btn-solid" onClick={load}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="rv-report-header-block">
        <div>
          <h1 style={{ margin: "0 0 4px" }}>Student scores</h1>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.92rem" }}>
            {subject.code} · {subject.term} · {subject.schoolYear}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "0.92rem" }}>
            {student.lastName}, {student.firstName}{" · "}
            {student.studentNumber}{" · "}
            Faculty: {subject.faculty}
          </p>
          <p style={{ margin: "6px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>
            Passing: {passingPercent}%{" · "}
            Average: {student.average}%{" · "}
            Remark: {student.remark}
          </p>
        </div>
        <div style={{ textAlign: "right" }}>
          <StatusBadge status={student.remark === "Passed" ? "completed" : "failed"} />
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
        <button type="button" className="btn btn-solid" onClick={() => { }}>
          Print
        </button>
        <button type="button" className="btn btn-solid" onClick={handleDownloadPdf}>
          Download PDF
        </button>
        <button type="button" className="btn btn-solid" onClick={handleDownloadExcel}>
          Download Excel
        </button>
        <button type="button" className="btn" onClick={handleDownloadCsv}>
          CSV
        </button>
      </div>

      <div className="rv-report-table-wrap">
        <table className="rv-report-table">
          <thead>
            <tr>
              <th className="rv-report-th">#</th>
              <th className="rv-report-th">Topic / Quiz</th>
              <th className="rv-report-th">Best score</th>
              <th className="rv-report-th">Percent</th>
              <th className="rv-report-th">Result</th>
              <th className="rv-report-th">Attempts</th>
            </tr>
          </thead>
          <tbody>
            {quizzes.map((q, i) => {
              const score = student.scores.find((s) => s && s.quizId === q.quizId);
              const passed = score
                ? Math.round(score.score * 100) * 100 >=
                  passingPercent * Math.round(score.total * 100)
                : false;
              return (
                <tr key={q.quizId} className="rv-report-row">
                  <td className="rv-report-td">{i + 1}</td>
                  <td className="rv-report-td">{q.topicTitle}</td>
                  <td className="rv-report-td">
                    {score ? `${score.score}/${score.total}` : '—'}
                  </td>
                  <td className="rv-report-td">
                    {score ? `${score.percent}%` : '—'}
                  </td>
                  <td className={`rv-report-td ${passed ? "" : "rv-report-td-failed"}`}>
                    {score ? (passed ? "Passed" : "Failed") : "—"}
                  </td>
                  <td className="rv-report-td">{score ? score.attempts : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="rv-report-footer">
        <p style={{ margin: 0, fontSize: "0.92rem", color: "var(--ink)" }}>
          Quizzes: {student.passedCount}/{student.quizCount} passed · Average:{" "}
          {student.average}% · Remark: <strong>{student.remark}</strong>
        </p>
      </div>
    </div>
  );
}

function buildReportLike(data) {
  const { subject, student, quizzes } = data;
  return {
    subject,
    generatedAt: new Date().toISOString(),
    quizzes,
    rows: [student],
    summary: {
      students: 1,
      classAverage: student.average,
      passRate:
        student.quizCount > 0
          ? Math.round((student.passedCount / student.quizCount) * 100)
          : 0,
    },
  };
}
