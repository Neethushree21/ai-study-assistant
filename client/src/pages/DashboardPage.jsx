import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getNotes, deleteNote } from '../api/notes';
import { getStats } from '../api/progress';
import { getUserQuizzes } from '../api/ai';
import Loader from '../components/Loader';
import AlertMessage from '../components/AlertMessage';

/** Format date to readable string */
const fmt = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

/** Determine score ring color class */
const scoreClass = (pct) =>
  pct >= 80 ? 'excellent' : pct >= 60 ? 'good' : pct >= 40 ? 'average' : 'poor';

/**
 * DashboardPage — shows stats, notes list, quiz history, and a progress bar chart.
 */
const DashboardPage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const [notes,   setNotes]   = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [deleting, setDeleting] = useState(null);
  const [activeTab, setActiveTab] = useState('notes');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [notesRes, statsRes, quizzesRes] = await Promise.all([
        getNotes(),
        getStats(),
        getUserQuizzes(),
      ]);
      setNotes(notesRes.data.notes || []);
      setStats(statsRes.data.stats || null);
      setQuizzes(quizzesRes.data.quizzes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (noteId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this note? This cannot be undone.')) return;
    setDeleting(noteId);
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n._id !== noteId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete note.');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="page-wrapper"><Loader message="Loading your dashboard…" /></div>;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        {/* ── Header ── */}
        <div className="dashboard-header fade-in-up">
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
            Here's your study progress at a glance
          </p>
        </div>

        <AlertMessage type="error" message={error} />

        {/* ── Stats ── */}
        <div className="stats-grid fade-in-up">
          <div className="stat-card">
            <div className="stat-icon indigo">📝</div>
            <div>
              <div className="stat-label">Notes Uploaded</div>
              <div className="stat-value">{notes.length}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon violet">🧠</div>
            <div>
              <div className="stat-label">Quizzes Taken</div>
              <div className="stat-value">{stats?.totalQuizzesTaken ?? 0}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">📈</div>
            <div>
              <div className="stat-label">Avg. Score</div>
              <div className="stat-value">{stats?.averageScore ?? 0}%</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon amber">🏆</div>
            <div>
              <div className="stat-label">Best Score</div>
              <div className="stat-value">{stats?.bestScore ?? 0}%</div>
            </div>
          </div>
        </div>

        {/* ── Progress Chart ── */}
        {stats?.recentScores?.length > 0 && (
          <div className="card chart-section fade-in-up">
            <div className="chart-title">📊 Recent Quiz Performance</div>
            <div className="bar-chart">
              {stats.recentScores.map((item, i) => (
                <div className="bar-item" key={i} title={`${item.quizTitle}: ${item.score}%`}>
                  <div className="bar-score">{item.score}%</div>
                  <div
                    className="bar-fill"
                    style={{ height: `${Math.max(item.score, 4)}%` }}
                  />
                  <div className="bar-label">{item.quizTitle?.replace('Quiz: ', '') || `Q${i + 1}`}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '2rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <span>✅ Accuracy: <strong style={{ color: 'var(--accent)' }}>{stats.accuracyRate}%</strong></span>
              <span>❓ Questions answered: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalQuestionsAnswered}</strong></span>
              <span>✔️ Correct: <strong style={{ color: 'var(--primary-light)' }}>{stats.totalCorrect}</strong></span>
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="tabs fade-in-up">
          <button className={`tab-btn${activeTab === 'notes' ? ' active' : ''}`} onClick={() => setActiveTab('notes')}>
            📝 My Notes ({notes.length})
          </button>
          <button className={`tab-btn${activeTab === 'quizzes' ? ' active' : ''}`} onClick={() => setActiveTab('quizzes')}>
            🧠 My Quizzes ({quizzes.length})
          </button>
        </div>

        {/* ── Notes Tab ── */}
        {activeTab === 'notes' && (
          <>
            <div className="section-header">
              <span className="section-title">Uploaded Notes</span>
              <Link to="/upload" className="btn btn-primary btn-sm">+ Upload New</Link>
            </div>

            {notes.length === 0 ? (
              <div className="empty-state fade-in">
                <div className="empty-icon">📂</div>
                <h3>No notes yet</h3>
                <p>Upload your first study note to get started!</p>
                <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                  Upload Notes →
                </Link>
              </div>
            ) : (
              <div className="notes-grid fade-in">
                {notes.map((note) => (
                  <div
                    key={note._id}
                    className="note-card"
                    onClick={() => navigate(`/upload?noteId=${note._id}`)}
                  >
                    <div className="note-card-header">
                      <div className="note-title">{note.title}</div>
                      <span className={`note-badge ${note.fileType === 'pdf' ? 'pdf' : 'txt'}`}>
                        {note.fileType?.toUpperCase() || 'TXT'}
                      </span>
                    </div>

                    <div className="note-meta">
                      <span className="note-meta-item">📅 {fmt(note.createdAt)}</span>
                      <span className="note-meta-item">📖 {note.wordCount?.toLocaleString()} words</span>
                    </div>

                    {note.isSummarized && (
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 600,
                        color: 'var(--accent)',
                        background: 'rgba(52,211,153,0.1)',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '4px',
                        width: 'fit-content',
                      }}>
                        ✓ Summarized
                      </span>
                    )}

                    <div className="note-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/upload?noteId=${note._id}`)}
                      >
                        👁 View
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => navigate(`/quiz?noteId=${note._id}`)}
                      >
                        🧠 Quiz
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={(e) => handleDelete(note._id, e)}
                        disabled={deleting === note._id}
                      >
                        {deleting === note._id ? '…' : '🗑'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Quizzes Tab ── */}
        {activeTab === 'quizzes' && (
          <>
            <div className="section-header">
              <span className="section-title">Quiz History</span>
            </div>

            {quizzes.length === 0 ? (
              <div className="empty-state fade-in">
                <div className="empty-icon">🧠</div>
                <h3>No quizzes yet</h3>
                <p>Generate a quiz from any of your notes!</p>
              </div>
            ) : (
              <div className="notes-grid fade-in">
                {quizzes.map((quiz) => (
                  <div key={quiz._id} className="note-card">
                    <div className="note-card-header">
                      <div className="note-title">{quiz.title}</div>
                      <span className="note-badge txt">{quiz.totalQuestions}Q</span>
                    </div>
                    <div className="note-meta">
                      <span className="note-meta-item">📚 {quiz.note?.title || 'Note'}</span>
                      <span className="note-meta-item">📅 {fmt(quiz.createdAt)}</span>
                    </div>
                    <div className="note-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/quiz?quizId=${quiz._id}`)}
                      >
                        ▶ Take Quiz
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
