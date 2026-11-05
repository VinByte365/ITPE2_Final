import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { listFacultyTopics, createTopic, reorderTopics, updateTopic, deleteTopic } from "../../api/topics";
import { getFacultySubject } from "../../api/subjects";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(value) {
  if (!value) return "";
  try { return new Date(value).toLocaleDateString(); } catch { return value; }
}

export default function FacultyTopics() {
  const { id: subjectId } = useParams();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addingIndex, setAddingIndex] = useState(null);
  const [addForm, setAddForm] = useState({ title: "", status: "draft" });
  const [subject, setSubject] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const [topicsData, subjectData] = await Promise.all([
          listFacultyTopics(subjectId),
          getFacultySubject(subjectId),
        ]);
        if (!cancelled) {
          setTopics(Array.isArray(topicsData) ? topicsData : []);
          setSubject(subjectData);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || "Failed to load topics.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [subjectId]);

  const getNextDate = () => {
    if (topics.length === 0 && subject?.startDate) {
      try {
        const [y, m, d] = String(subject.startDate).split('T')[0].split('-').map(Number);
        if (!y || !m || !d) return "";
        const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
        if (Number.isNaN(date.getTime())) return "";
        if (subject.meetingDay !== null && subject.meetingDay !== undefined && subject.meetingDay !== '') {
          const diff = (Number(subject.meetingDay) - date.getUTCDay() + 7) % 7;
          date.setUTCDate(date.getUTCDate() + diff);
        }
        return date.toISOString().slice(0, 10);
      } catch {
        return "";
      }
    }
    if (topics.length > 0) {
      const last = topics[topics.length - 1];
      if (last.availableFrom) {
        try {
          const [y, m, d] = String(last.availableFrom).split('T')[0].split('-').map(Number);
          if (!y || !m || !d) return "";
          const date = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
          if (Number.isNaN(date.getTime())) return "";
          date.setUTCDate(date.getUTCDate() + 7);
          return date.toISOString().slice(0, 10);
        } catch {
          return "";
        }
      }
    }
    return "";
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const availableFrom = getNextDate();
      if (!availableFrom) {
        setError("Set a term start date and meeting day for this subject first.");
        return;
      }
      await createTopic(subjectId, { ...addForm, availableFrom });
      setAddingIndex(null);
      setAddForm({ title: "", status: "draft" });
      const [topicsData, subjectData] = await Promise.all([
        listFacultyTopics(subjectId),
        getFacultySubject(subjectId),
      ]);
      setTopics(Array.isArray(topicsData) ? topicsData : []);
      setSubject(subjectData);
    } catch (err) { setError(err?.message || "Failed to create topic."); }
  };

  const handleReorder = async (index, dir) => {
    const next = [...topics];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const ids = next.map((t) => t.id);
    try {
      const updated = await reorderTopics(subjectId, ids);
      setTopics(Array.isArray(updated) ? updated : next);
    } catch (err) { setError(err?.message || "Reorder failed."); }
  };

  const handleTogglePublish = async (topic) => {
    try {
      const newStatus = topic.status === "published" ? "draft" : "published";
      await updateTopic(topic.id, { status: newStatus });
      const [topicsData, subjectData] = await Promise.all([listFacultyTopics(subjectId), getFacultySubject(subjectId)]);
      setTopics(Array.isArray(topicsData)?topicsData:[]); setSubject(subjectData);
    } catch (err) { setError(err?.message || "Update failed."); }
  };

  const handleDelete = async (topic) => {
    if (!window.confirm(`Delete topic "${topic.title}"?`)) return;
    try { await deleteTopic(topic.id); const [topicsData, subjectData] = await Promise.all([listFacultyTopics(subjectId), getFacultySubject(subjectId)]); setTopics(Array.isArray(topicsData)?topicsData:[]); setSubject(subjectData); }
    catch (err) { setError(err?.message || "Delete failed."); }
  };

  if (loading) return <div className="page-shell"><p>Loading topics…</p></div>;

  return (
    <div className="page-shell">
      <h1>Topics</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}

      {topics.length === 0 ? (
        <div className="ft-list">
          <div className="ft-empty">No topics yet.</div>
          <button type="button" className="ft-add-row" onClick={() => { setAddingIndex(0); setAddForm({ title: "", status: "draft" }); }} aria-label="Add topic">
            <span className="ft-plus">+</span>
          </button>
          {addingIndex === 0 && (
            <form onSubmit={handleAdd} className="ft-inline-form ft-inline-form-row">
              <input placeholder="Topic title" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} required />
              <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}><option value="draft">draft</option><option value="published">published</option></select>
              <button type="submit" className="btn">Add</button>
              <button type="button" className="btn" onClick={() => setAddingIndex(null)}>Cancel</button>
            </form>
          )}
        </div>
      ) : (
        <div className="ft-list">
          {topics.map((t, idx) => (
            <div key={t.id} className="ft-row">
              <span className="ft-row-num">{t.position}.</span>
              <div className="ft-row-main">
                <div className="ft-row-title">{t.title}</div>
                <div className="ft-row-meta">{formatDate(t.availableFrom)} <StatusBadge status={t.status} /></div>
              </div>
              <div className="ft-row-actions">
                <button onClick={() => handleReorder(idx, -1)} disabled={idx === 0} aria-disabled={idx === 0}>↑</button>
                <button onClick={() => handleReorder(idx, 1)} disabled={idx === topics.length - 1} aria-disabled={idx === topics.length - 1}>↓</button>
                <button onClick={() => handleTogglePublish(t)}>{t.status === "published" ? "Unpublish" : "Publish"}</button>
                <Link to={`/faculty/topics/${t.id}`}>Edit</Link>
                <Link to={`/faculty/topics/${t.id}/quiz`}>Quiz</Link>
                <button onClick={() => handleDelete(t)}>Delete</button>
              </div>
            </div>
          ))}
          <button type="button" className="ft-add-row" onClick={() => { setAddingIndex(topics.length); setAddForm({ title: "", status: "draft" }); }} aria-label="Add topic">
            <span className="ft-plus">+</span>
          </button>
          {addingIndex === topics.length && (
            <form onSubmit={handleAdd} className="ft-inline-form ft-inline-form-row">
              <input placeholder="Topic title" value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} required />
              <select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}><option value="draft">draft</option><option value="published">published</option></select>
              <button type="submit" className="btn">Add</button>
              <button type="button" className="btn" onClick={() => setAddingIndex(null)}>Cancel</button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
