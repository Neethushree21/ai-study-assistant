import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getUserQuizzes, getQuiz, generateQuiz, submitQuiz } from '../api/ai';
import { saveProgress } from '../api/progress';
import { getNotes } from '../api/notes';
import AlertMessage from '../components/AlertMessage';
import Loader from '../components/Loader';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

/** Score ring class based on percentage */
const ringClass = (pct) =>
  pct >= 80 ? 'excellent' : pct >= 60 ? 'good' : pct >= 40 ? 'average' : 'poor';

/** Score emoji */
const scoreEmoji = (pct) =>
  pct >= 80 ? '🏆' : pct >= 60 ? '🎯' : pct >= 40 ? '📘' : '💪';

/**
 * QuizPage — three modes:
 *  1. Selection: pick a note to generate a quiz, or pick an existing quiz
 *  2. Taking: answer MCQ questions one by one
 *  3. Results: view score, answers review, save progress
 */
const QuizPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlQuizId  = searchParams.get('quizId');
  const urlNoteId  = searchParams.get('noteId');

  // ── State ──────────────────────────────────────────────────────
  const [mode,    setMode]    = useState('selection'); // 'selection' | 'taking' | 'results'
  const [notes,   setNotes]   = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [quiz,    setQuiz]    = useState(null);
  const [results, setResults] = useState(null);

  const [answers,       setAnswers]       = useState([]); // selected indices per question
  const [currentQ,      setCurrentQ]      = useState(0);
  const [showExplain,   setShowExplain]   = useState(false);
  const [revealed,      setRevealed]      = useState(false); // per-question reveal

  const [loading,       setLoading]       = useState(true);
  const [generating,    setGenerating]    = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [savingProgress,setSavingProgress]= useState(false);
  const [error,         setError]         = useState('');

  // ── Load initial data ──────────────────────────────────────────
  const init = useCallback(async () => {
    setLoading(true);
    try {
      const [notesRes, quizzesRes] = await Promise.all([getNotes(), getUserQuizzes()]);
      setNotes(notesRes.data.notes || []);
      setQuizzes(quizzesRes.data.quizzes || []);
    } catch { /* silent */ }
    setLoading(false);
  }, []);

  useEffect(() => { init(); }, [init]);

  // Auto-load quiz if quizId or noteId in URL
  useEffect(() => {
    if (urlQuizId && mode === 'selection') startExistingQuiz(urlQuizId);
    else if (urlNoteId && mode === 'selection') generateFromNote(urlNoteId);
  }, [urlQuizId, urlNoteId]); // eslint-disable-line

  // ── Load existing quiz ─────────────────────────────────────────
  const startExistingQuiz = async (quizId) => {
    setError('');
    setLoading(true);
    try {
      const { data } = await getQuiz(quizId);
      setQuiz(data.quiz);
      setAnswers(new Array(data.quiz.questions.length).fill(null));
      setCurrentQ(0);
      setMode('taking');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load quiz.');
    } finally {
      setLoading(false);
    }
  };

  // ── Generate quiz from note ────────────────────────────────────
  const generateFromNote = async (noteId) => {
    setError('');
    setGenerating(true);
    try {
      const { data } = await generateQuiz(noteId, 5);
      // Fetch full quiz with questions
      const quizRes  = await getQuiz(data.quiz.id);
      setQuiz(quizRes.data.quiz);
      setAnswers(new Array(quizRes.data.quiz.questions.length).fill(null));
      setCurrentQ(0);
      setMode('taking');
    } catch (err) {
      setError(err.response?.data?.message || 'Quiz generation failed. Make sure the note has enough content.');
    } finally {
      setGenerating(false);
    }
  };

  // ── Answer selection ───────────────────────────────────────────
  const selectAnswer = (optionIdx) => {
    if (revealed) return; // already locked in
    setAnswers((prev) => {
      const copy = [...prev];
      copy[currentQ] = optionIdx;
      return copy;
    });
  };

  const handleNext = () => {
    setRevealed(false);
    setShowExplain(false);
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ((q) => q + 1);
    }
  };

  const handlePrev = () => {
    setRevealed(false);
    setShowExplain(false);
    if (currentQ > 0) setCurrentQ((q) => q - 1);
  };

  // ── Submit quiz ────────────────────────────────────────────────
  const handleSubmit = async () => {
    const unanswered = answers.filter((a) => a === null).length;
    if (unanswered > 0 && !window.confirm(`You have ${unanswered} unanswered question(s). Submit anyway?`)) return;

    setSubmitting(true);
    setError('');
    try {
      // Fill nulls with 0 to avoid server error
      const safeAnswers = answers.map((a) => (a === null ? 0 : a));
      const { data } = await submitQuiz(quiz.id, safeAnswers);
      setResults(data.results);
      setMode('results');
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Save progress to DB ────────────────────────────────────────
  const handleSaveProgress = async () => {
    if (!results) return;
    setSavingProgress(true);
    try {
      await saveProgress({
        quizId:         quiz.id,
        noteId:         quiz.noteId,
        score:          results.score,
        totalQuestions: results.totalQuestions,
        answers:        results.answers.map((a) => ({
          questionIndex:  a.questionIndex,
          selectedAnswer: a.selectedAnswer,
          isCorrect:      a.isCorrect,
        })),
      });
      alert('Progress saved! ✅');
    } catch {
      alert('Could not save progress. Please try again.');
    } finally {
      setSavingProgress(false);
    }
  };

  const resetQuiz = () => {
    setMode('selection');
    setQuiz(null);
    setResults(null);
    setAnswers([]);
    setCurrentQ(0);
    setRevealed(false);
    setError('');
    navigate('/quiz', { replace: true });
    init();
  };

  // ── Render: Loading ────────────────────────────────────────────
  if (loading || generating) {
    return (
      <div className="page-wrapper">
        <Loader message={generating ? 'Generating your quiz with AI… ✨' : 'Loading quiz…'} />
      </div>
    );
  }

  // ── Render: Results ────────────────────────────────────────────
  if (mode === 'results' && results) {
    const { score, totalQuestions, percentage, answers: gradedAnswers } = results;
    const ring = ringClass(percentage);
    return (
      <div className="page-wrapper">
        <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem', maxWidth: 760 }}>
          <div className="card results-card fade-in-up">
            <div className={`score-circle ${ring}`}>
              <div className="score-number">{percentage}%</div>
              <div className="score-label">Score</div>
            </div>

            <h2 style={{ marginBottom: '0.25rem' }}>{scoreEmoji(percentage)} Quiz Complete!</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>{quiz?.title}</p>

            <div className="result-breakdown">
              <div className="result-item">
                <div className="value" style={{ color: 'var(--accent)' }}>{score}</div>
                <div className="label">Correct</div>
              </div>
              <div className="result-item">
                <div className="value" style={{ color: 'var(--danger)' }}>{totalQuestions - score}</div>
                <div className="label">Wrong</div>
              </div>
              <div className="result-item">
                <div className="value">{totalQuestions}</div>
                <div className="label">Total</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
              <button
                id="save-progress-btn"
                className="btn btn-primary"
                onClick={handleSaveProgress}
                disabled={savingProgress}
              >
                {savingProgress ? 'Saving…' : '💾 Save Progress'}
              </button>
              <button className="btn btn-outline" onClick={resetQuiz}>↩ Back to Quizzes</button>
              <Link to="/dashboard" className="btn btn-ghost">📊 Dashboard</Link>
            </div>

            {/* Answer Review */}
            <div className="answer-review">
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 1rem' }}>📋 Answer Review</h3>
              {gradedAnswers.map((a, i) => (
                <div key={i} className={`answer-item ${a.isCorrect ? 'correct' : 'incorrect'}`}>
                  <div className="answer-question">
                    <span style={{ marginRight: '0.5rem' }}>{a.isCorrect ? '✅' : '❌'}</span>
                    Q{i + 1}: {a.question}
                  </div>
                  <div style={{ fontSize: '0.8rem', marginTop: '0.35rem', color: 'var(--text-secondary)' }}>
                    <span>Your answer: <strong>{a.options?.[a.selectedAnswer] ?? '—'}</strong></span>
                    {!a.isCorrect && (
                      <span style={{ marginLeft: '1rem', color: 'var(--accent)' }}>
                        Correct: <strong>{a.options?.[a.correctAnswer]}</strong>
                      </span>
                    )}
                  </div>
                  {a.explanation && (
                    <div className="answer-explanation">💡 {a.explanation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Taking Quiz ────────────────────────────────────────
  if (mode === 'taking' && quiz) {
    const q        = quiz.questions[currentQ];
    const selected = answers[currentQ];
    const progress = ((currentQ + 1) / quiz.questions.length) * 100;
    const isLast   = currentQ === quiz.questions.length - 1;
    const allDone  = answers.every((a) => a !== null);

    return (
      <div className="page-wrapper">
        <div className="container quiz-page fade-in-up" style={{ paddingTop: '2rem' }}>

          {/* Header */}
          <div className="quiz-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🧠 {quiz.title}
              </span>
              <span className="question-count">
                {currentQ + 1} / {quiz.questions.length}
              </span>
            </div>
            <div className="quiz-progress-bar">
              <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <AlertMessage type="error" message={error} />

          {/* Question Card */}
          <div className="question-card">
            <div className="question-text">Q{currentQ + 1}. {q.question}</div>

            <div className="options-list">
              {q.options.map((opt, idx) => {
                let cls = 'option-btn';
                if (selected === idx) cls += ' selected';
                return (
                  <button
                    key={idx}
                    className={cls}
                    onClick={() => selectAnswer(idx)}
                    disabled={false}
                    id={`option-${idx}`}
                  >
                    <span className="option-letter">{OPTION_LETTERS[idx]}</span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation */}
          <div className="quiz-nav">
            <button
              className="btn btn-ghost"
              onClick={handlePrev}
              disabled={currentQ === 0}
            >
              ← Previous
            </button>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* Answer dots */}
              {quiz.questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setCurrentQ(i); setRevealed(false); setShowExplain(false); }}
                  style={{
                    width: 10, height: 10,
                    borderRadius: '50%',
                    border: 'none',
                    cursor: 'pointer',
                    background: i === currentQ
                      ? 'var(--primary)'
                      : answers[i] !== null
                        ? 'var(--accent)'
                        : 'var(--border)',
                    transition: 'var(--transition)',
                  }}
                  title={`Question ${i + 1}`}
                />
              ))}
            </div>

            {isLast ? (
              <button
                id="submit-quiz-btn"
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Submitting…</>
                  : `🏁 Submit${!allDone ? ' Anyway' : ''}`}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleNext}
              >
                Next →
              </button>
            )}
          </div>

          {/* Skip to end */}
          {!isLast && allDone && (
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-outline btn-sm" onClick={handleSubmit} disabled={submitting}>
                🏁 Submit Quiz
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Render: Selection ──────────────────────────────────────────
  return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>

        <div className="fade-in-up" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🧠 Quiz Center
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Generate a new quiz from your notes or retake a previous one.
          </p>
        </div>

        <AlertMessage type="error" message={error} />

        {/* Generate New Quiz */}
        <div className="section-header">
          <span className="section-title">Generate Quiz from Notes</span>
        </div>

        {notes.length === 0 ? (
          <div className="empty-state card" style={{ marginBottom: '2rem' }}>
            <div className="empty-icon">📂</div>
            <h3>No notes yet</h3>
            <p>Upload a note first to generate a quiz.</p>
            <Link to="/upload" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Upload Notes →
            </Link>
          </div>
        ) : (
          <div className="notes-grid fade-in" style={{ marginBottom: '2rem' }}>
            {notes.map((note) => (
              <div key={note._id} className="note-card">
                <div className="note-card-header">
                  <div className="note-title">{note.title}</div>
                  <span className={`note-badge ${note.fileType === 'pdf' ? 'pdf' : 'txt'}`}>
                    {note.fileType?.toUpperCase() || 'TXT'}
                  </span>
                </div>
                <div className="note-meta">
                  <span className="note-meta-item">📖 {note.wordCount?.toLocaleString()} words</span>
                </div>
                <button
                  id={`gen-quiz-${note._id}`}
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: '0.5rem', width: '100%' }}
                  onClick={() => generateFromNote(note._id)}
                  disabled={generating}
                >
                  {generating ? '⏳ Generating…' : '🧠 Generate Quiz'}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Previous Quizzes */}
        {quizzes.length > 0 && (
          <>
            <div className="section-header">
              <span className="section-title">Previous Quizzes</span>
            </div>
            <div className="notes-grid fade-in">
              {quizzes.map((q) => (
                <div key={q._id} className="note-card">
                  <div className="note-card-header">
                    <div className="note-title">{q.title}</div>
                    <span className="note-badge txt">{q.totalQuestions}Q</span>
                  </div>
                  <div className="note-meta">
                    <span className="note-meta-item">📚 {q.note?.title}</span>
                    <span className="note-meta-item">
                      📅 {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '0.5rem', width: '100%' }}
                    onClick={() => startExistingQuiz(q._id)}
                  >
                    ▶ Retake Quiz
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default QuizPage;
