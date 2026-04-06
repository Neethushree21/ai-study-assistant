import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { uploadNote, getNoteById } from '../api/notes';
import { summarizeNote, generateQuiz } from '../api/ai';
import AlertMessage from '../components/AlertMessage';
import Loader from '../components/Loader';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * UploadNotesPage — upload a PDF/txt file or paste raw text,
 * view extracted content, generate AI summary, and launch a quiz.
 */
const UploadNotesPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preloadedNoteId = searchParams.get('noteId');

  // Form state
  const [title,       setTitle]       = useState('');
  const [file,        setFile]        = useState(null);
  const [textContent, setTextContent] = useState('');
  const [dragOver,    setDragOver]    = useState(false);
  const fileInputRef = useRef(null);

  // View state
  const [note,        setNote]        = useState(null);
  const [summary,     setSummary]     = useState('');
  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [uploading,   setUploading]   = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [generatingQ, setGeneratingQ] = useState(false);

  // Load existing note if ?noteId= is in URL
  const loadNote = useCallback(async (id) => {
    try {
      const { data } = await getNoteById(id);
      setNote(data.note);
      setTitle(data.note.title);
      setSummary(data.note.summary || '');
    } catch {
      setError('Could not load the requested note.');
    }
  }, []);

  useEffect(() => {
    if (preloadedNoteId) loadNote(preloadedNoteId);
  }, [preloadedNoteId, loadNote]);

  // ── File handling ──────────────────────────────────────────────
  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError('File too large. Maximum size is 10 MB.');
      return;
    }
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) {
      setError('Only PDF and .txt files are supported.');
      return;
    }
    setError('');
    setFile(selectedFile);
    if (!title) setTitle(selectedFile.name.replace(/\.[^.]+$/, ''));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileChange(e.dataTransfer.files[0]);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Upload ────────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!title.trim()) { setError('Please enter a title for this note.'); return; }
    if (!file && !textContent.trim()) {
      setError('Please upload a file or paste text content.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('textContent', textContent.trim());
      }

      const { data } = await uploadNote(formData);
      setSuccess(`Note "${data.note.title}" uploaded successfully! (${data.note.wordCount} words)`);
      setNote(data.note);
      setFile(null);
      setTextContent('');
      // Reload full note (with extractedText)
      await loadNote(data.note.id);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Summarize ────────────────────────────────────────────────
  const handleSummarize = async () => {
    if (!note?._id) return;
    setSummarizing(true); setError('');
    try {
      const { data } = await summarizeNote(note._id);
      setSummary(data.summary);
      setSuccess('Summary generated!');
    } catch (err) {
      setError(err.response?.data?.message || 'Summarization failed.');
    } finally {
      setSummarizing(false);
    }
  };

  // ── Generate Quiz ────────────────────────────────────────────
  const handleGenerateQuiz = async () => {
    if (!note?._id) return;
    setGeneratingQ(true); setError('');
    try {
      const { data } = await generateQuiz(note._id, 5);
      navigate(`/quiz?quizId=${data.quiz.id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Quiz generation failed.');
    } finally {
      setGeneratingQ(false);
    }
  };

  const isViewMode = !!note;

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 760 }}>

        <div className="upload-page fade-in-up">
          <h1>{isViewMode ? `📄 ${note.title}` : '📤 Upload Study Notes'}</h1>
          <p className="subtitle">
            {isViewMode
              ? `${note.wordCount?.toLocaleString()} words · Uploaded ${new Date(note.createdAt).toLocaleDateString()}`
              : 'Upload a PDF or .txt file, or paste your notes directly.'}
          </p>

          <AlertMessage type="error"   message={error} />
          <AlertMessage type="success" message={success} />

          {/* ── View Mode: Existing Note ── */}
          {isViewMode ? (
            <div className="fade-in">
              {/* Extracted Text Preview */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
                    📃 Extracted Text Preview
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {note.wordCount?.toLocaleString()} words
                  </span>
                </div>
                <div style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  maxHeight: 280,
                  overflowY: 'auto',
                  padding: '0.75rem',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  whiteSpace: 'pre-wrap',
                }}>
                  {note.extractedText?.slice(0, 1500)}
                  {note.extractedText?.length > 1500 && (
                    <span style={{ color: 'var(--text-muted)' }}> …(truncated for preview)</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <button
                  id="summarize-btn"
                  className="btn btn-primary"
                  onClick={handleSummarize}
                  disabled={summarizing}
                >
                  {summarizing ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Summarizing…</>
                  ) : '✨ Generate Summary'}
                </button>

                <button
                  id="generate-quiz-btn"
                  className="btn btn-outline"
                  onClick={handleGenerateQuiz}
                  disabled={generatingQ}
                >
                  {generatingQ ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Generating…</>
                  ) : '🧠 Generate Quiz'}
                </button>

                <button
                  className="btn btn-ghost"
                  onClick={() => { setNote(null); setSummary(''); setSuccess(''); setError(''); navigate('/upload'); }}
                >
                  ← Upload Another
                </button>
              </div>

              {/* Summary Output */}
              {summary && (
                <div className="summary-box fade-in">
                  <h3>✨ AI Summary</h3>
                  <p className="summary-text">{summary}</p>
                </div>
              )}
            </div>
          ) : (
            /* ── Upload Mode ── */
            <form onSubmit={handleUpload} noValidate>
              {/* Title */}
              <div className="form-group">
                <label className="form-label" htmlFor="note-title">Note Title *</label>
                <input
                  id="note-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Chapter 3 — Cell Biology"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              {/* File Drop Zone */}
              <div
                id="drop-zone"
                className={`upload-area${dragOver ? ' drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => handleFileChange(e.target.files[0])}
                />
                <div className="upload-icon">☁️</div>
                <p className="upload-text">
                  <strong>Click to browse</strong> or drag &amp; drop your file here
                </p>
                <p className="upload-hint">PDF or .txt · Max 10 MB</p>
              </div>

              {/* Selected File Preview */}
              {file && (
                <div className="file-selected">
                  <span className="file-icon">{file.name.endsWith('.pdf') ? '📕' : '📄'}</span>
                  <div>
                    <div className="file-name">{file.name}</div>
                    <div className="file-size">{formatSize(file.size)}</div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => setFile(null)}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Divider */}
              <div className="divider-text">or paste text directly</div>

              {/* Text Area */}
              <div className="form-group">
                <label className="form-label" htmlFor="text-content">Paste Your Notes</label>
                <textarea
                  id="text-content"
                  className="form-textarea"
                  placeholder="Paste your study notes here… (minimum 50 words recommended)"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  rows={8}
                  disabled={!!file}
                />
                {textContent && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {textContent.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                )}
              </div>

              <button
                id="upload-submit-btn"
                type="submit"
                className="btn btn-primary btn-lg btn-full"
                disabled={uploading}
              >
                {uploading ? (
                  <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Uploading &amp; Extracting…</>
                ) : '📤 Upload Note'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadNotesPage;
