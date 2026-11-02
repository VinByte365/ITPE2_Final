import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StatusBadge from "../../components/StatusBadge";
import { listFacultyTopics, createTopic, bulkCreateTopics, reorderTopics, updateTopic, deleteTopic } from "../../api/topics";

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
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ title: "", availableFrom: "", status: "draft" });
  const [showBulk, setShowBulk] = useState(false);
  const [bulk, setBulk] = useState({ count: 8, startDate: "", meetingDays: [2, 4], titlePrefix: "Topic" });
  const [bulkPreview, setBulkPreview] = useState([]);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const data = await listFacultyTopics(subjectId);
      setTopics(Array.isArray(data) ? data : []);
    } catch (err) { setError(err?.message || "Failed to load topics."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [subjectId]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createTopic(subjectId, addForm);
      setShowAdd(false);
      setAddForm({ title: "", availableFrom: "", status: "draft" });
      load();
    } catch (err) { setError(err?.message || "Failed to create topic."); }
  };

  const handleBulkPreview = () => {
    const days = new Set(bulk.meetingDays);
    const result = [];
    const [y, m, d] = (bulk.startDate || "").split("-").map(Number);
    if (!y) return;
    const cur = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    let it = 0;
    while (result.length < (bulk.count || 0) && it < bulk.count * 7 + 7) {
      it++;
      if (days.has(cur.getUTCDay())) result.push(cur.toISOString().slice(0, 10));
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    setBulkPreview(result);
  };

  const handleBulkSave = async () => {
    try {
      await bulkCreateTopics(subjectId, bulk);
      setShowBulk(false); setBulkPreview([]); load();
    } catch (err) { setError(err?.message || "Bulk create failed."); }
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
      load();
    } catch (err) { setError(err?.message || "Update failed."); }
  };

  const handleDelete = async (topic) => {
    if (!window.confirm(`Delete topic "${topic.title}"?`)) return;
    try { await deleteTopic(topic.id); load(); }
    catch (err) { setError(err?.message || "Delete failed."); }
  };

  if (loading) return <div className="page-shell"><p>Loading topics...</p></div>;

  return (
    <div className="page-shell">
      <h1>Topics</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}
      <div style={{ marginBottom: 12 }}>
        <button className="button" onClick={() => setShowAdd((v) => !v)}>Add topic</button>{" "}
        <button className="button" onClick={() => setShowBulk((v) => !v)}>Bulk add</button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} style={{ marginBottom: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <div><label>Title<input value={addForm.title} onChange={(e) => setAddForm({ ...addForm, title: e.target.value })} required /></label></div>
          <div><label>Available from (YYYY-MM-DD)<input value={addForm.availableFrom} onChange={(e) => setAddForm({ ...addForm, availableFrom: e.target.value })} required /></label></div>
          <div><label>Status<select value={addForm.status} onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}><option value="draft">draft</option><option value="published">published</option></select></label></div>
          <button type="submit" className="button">Create</button>
        </form>
      )}

      {showBulk && (
        <div style={{ marginBottom: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
          <div><label>Count<input type="number" value={bulk.count} onChange={(e) => setBulk({ ...bulk, count: Number(e.target.value) })} /></label></div>
          <div><label>Start date<input value={bulk.startDate} onChange={(e) => setBulk({ ...bulk, startDate: e.target.value })} /></label></div>
          <div><label>Title prefix<input value={bulk.titlePrefix} onChange={(e) => setBulk({ ...bulk, titlePrefix: e.target.value })} /></label></div>
          <div><label>Meeting days{WEEKDAYS.map((d, i) => (<label key={d} style={{ marginRight: 8 }}><input type="checkbox" checked={bulk.meetingDays.includes(i)} onChange={(e) => { const next = e.target.checked ? [...bulk.meetingDays, i] : bulk.meetingDays.filter((x) => x !== i); setBulk({ ...bulk, meetingDays: next }); }} />{d}</label>))}</label></div>
          <button type="button" onClick={handleBulkPreview}>Preview dates</button>
          {bulkPreview.length > 0 && (<ul style={{ maxHeight: 120, overflow: "auto" }}>{bulkPreview.map((d) => <li key={d}>{d}</li>)}</ul>)}
          <div style={{ marginTop: 8 }}><button type="button" className="button" onClick={handleBulkSave} disabled={bulkPreview.length === 0}>Save bulk</button></div>
        </div>
      )}

      {topics.length === 0 ? <p>No topics yet.</p> : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {topics.map((t, idx) => (
            <li key={t.id} style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontWeight: 600 }}>{t.position}.</span>
              <div style={{ flex: 1 }}>
                <div>{t.title}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{formatDate(t.availableFrom)} <StatusBadge status={t.status} /></div>
              </div>
              <button onClick={() => handleReorder(idx, -1)} disabled={idx === 0}>?</button>
              <button onClick={() => handleReorder(idx, 1)} disabled={idx === topics.length - 1}>?</button>
              <button onClick={() => handleTogglePublish(t)}>{t.status === "published" ? "Unpublish" : "Publish"}</button>
              <Link to={`/faculty/topics/${t.id}`}>Edit</Link>
              <button onClick={() => handleDelete(t)}>Delete</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}