import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MarkdownView from "../../components/MarkdownView";
import SlidesEmbed from "../../components/SlidesEmbed";
import FileUpload from "../../components/FileUpload";
import {
  getUploadUrl,
  listTopicContent,
  createContentBlock,
  updateContentBlock,
  deleteContentBlock,
  reorderContentBlocks,
  updateTopic,
} from "../../api/topics";

const BLOCK_TYPES = ["text", "summary", "notes", "presentation", "video"];

export default function TopicEditor() {
  const { id: topicId } = useParams();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [status, setStatus] = useState("draft");
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // new block form
  const [newType, setNewType] = useState("text");
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newVisible, setNewVisible] = useState(true);
  const [preview, setPreview] = useState(false);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const content = await listTopicContent(topicId);
      setBlocks(Array.isArray(content) ? content : []);
    } catch (err) { setError(err?.message || "Failed to load content."); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [topicId]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTopic(topicId, { title, description, availableFrom, status });
    } catch (err) { setError(err?.message || "Save failed."); }
    finally { setSaving(false); }
  };

  const handleAddBlock = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: newType,
        title: newTitle || null,
        body: ["text", "summary", "notes"].includes(newType) ? newBody : null,
        url: ["presentation", "video"].includes(newType) ? (newUrl || null) : null,
        visibleToStudents: newVisible,
      };
      await createContentBlock(topicId, payload);
      setNewTitle(""); setNewBody(""); setNewUrl("");
      load();
    } catch (err) { setError(err?.message || "Add block failed."); }
  };

  const handleDeleteBlock = async (blockId) => {
    if (!window.confirm("Delete this block?")) return;
    try { await deleteContentBlock(blockId); load(); }
    catch (err) { setError(err?.message || "Delete failed."); }
  };

  const handleToggleVisible = async (block) => {
    try {
      await updateContentBlock(block.id, { visibleToStudents: !block.visibleToStudents });
      load();
    } catch (err) { setError(err?.message || "Update failed."); }
  };

  const handleReorderBlock = async (index, dir) => {
    const next = [...blocks];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const ids = next.map((b) => b.id);
    try {
      const updated = await reorderContentBlocks(topicId, ids);
      setBlocks(Array.isArray(updated) ? updated : next);
    } catch (err) { setError(err?.message || "Reorder failed."); }
  };

  const handleUpload = async (path) => {
    try {
      await createContentBlock(topicId, {
        type: "presentation",
        title: newTitle || null,
        filePath: path,
        fileName: newTitle || "file",
        visibleToStudents: newVisible,
      });
      load();
    } catch (err) { setError(err?.message || "Save block failed."); }
  };

  if (loading) return <div className="page-shell"><p>Loading...</p></div>;

  return (
    <div className="page-shell">
      <h1>Topic Editor</h1>
      {error && <div className="auth-error" role="alert">{error}</div>}

      <form onSubmit={handleSaveDetails} style={{ marginBottom: 24, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h2>Details</h2>
        <div><label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} /></label></div>
        <div><label>Description<textarea value={description} onChange={(e) => setDescription(e.target.value)} /></label></div>
        <div><label>Available from<input value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} /></label></div>
        <div><label>Status<select value={status} onChange={(e) => setStatus(e.target.value)}><option value="draft">draft</option><option value="published">published</option></select></label></div>
        <button type="submit" className="button" disabled={saving}>{saving ? "Saving..." : "Save details"}</button>
      </form>

      <h2>Content blocks</h2>
      {blocks.length === 0 && <p>No content blocks yet.</p>}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {blocks.map((b, idx) => (
          <li key={b.id} style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong>{b.type}</strong>
              {b.title && <span>-- {b.title}</span>}
              <span style={{ marginLeft: "auto", fontSize: 12 }}>
                {b.visibleToStudents ? "students" : "faculty-only"}
              </span>
            </div>
            {b.body && (
              <div style={{ marginTop: 6 }}>
                {preview ? <MarkdownView content={b.body} /> : <pre style={{ whiteSpace: "pre-wrap" }}>{b.body}</pre>}
              </div>
            )}
            {b.url && <p style={{ marginTop: 6 }}><a href={b.url} target="_blank" rel="noopener noreferrer">{b.url}</a></p>}
            {b.filePath && <SlidesEmbed fileUrl={`#`} fileName={b.fileName} title={b.title} />}
            <div style={{ marginTop: 6, display: "flex", gap: 6 }}>
              <button onClick={() => handleReorderBlock(idx, -1)} disabled={idx === 0}>?</button>
              <button onClick={() => handleReorderBlock(idx, 1)} disabled={idx === blocks.length - 1}>?</button>
              <button onClick={() => handleToggleVisible(b)}>{b.visibleToStudents ? "Make faculty-only" : "Make visible"}</button>
              <button onClick={() => handleDeleteBlock(b.id)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 16, padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>Add block</h3>
        <div>
          <label>Type
            <select value={newType} onChange={(e) => setNewType(e.target.value)}>
              {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <div><label>Title<input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} /></label></div>
        {(["text", "summary", "notes"].includes(newType)) && (
          <div>
            <label>Body (markdown)
              <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={6} />
            </label>
            <label><input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> Preview markdown</label>
            {preview && <MarkdownView content={newBody} />}
          </div>
        )}
        {(["presentation", "video"].includes(newType)) && (
          <div><label>URL<input value={newUrl} onChange={(e) => setNewUrl(e.target.value)} /></label></div>
        )}
        <div><label><input type="checkbox" checked={newVisible} onChange={(e) => setNewVisible(e.target.checked)} /> Visible to students</label></div>

        {newType === "presentation" && (
          <div style={{ marginTop: 8 }}>
            <FileUpload
              accept=".pdf,.pptx"
              maxSizeMb={25}
              getUploadUrl={(info) => getUploadUrl(topicId, { ...info, kind: "presentation" })}
              onUploaded={handleUpload}
              onError={setError}
            />
          </div>
        )}

        {!(newType === "presentation") && (
          <button type="button" className="button" style={{ marginTop: 8 }} onClick={handleAddBlock}>Add block</button>
        )}
      </div>
    </div>
  );
}
