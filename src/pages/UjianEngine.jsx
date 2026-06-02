import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import MetakognitifPopup from '../components/MetakognitifPopup';
import QuestionInput from '../components/exam/QuestionInput';
import { SUBJECTS } from '../data/questions';
import { getQuestionTypeConfig, isAnswered } from '../data/questionTypes';

export default function UjianEngine() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { activeDraft, saveAnswer, toggleRagu, updateElapsed, submitSession, updateTimeSpent } = useStore();

  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [submittedSession, setSubmittedSession] = useState(null);
  const timerRef = useRef(null);
  const startRef = useRef(Date.now());
  const questionEntryTimeRef = useRef(Date.now());

  const draft = activeDraft;
  const questions = draft?.questions ?? [];
  const answers = draft?.answers ?? {};
  const ragu = draft?.ragu ?? {};
  const timerEnabled = draft?.timerEnabled ?? false;
  const totalTime = questions.length * 90; // 90s per question

  // If no draft or wrong session, redirect
  useEffect(() => {
    if (!draft) {
      navigate('/setup-ujian', { replace: true });
    }
  }, [draft, navigate]);

  // Timer
  useEffect(() => {
    if (!timerEnabled) return;
    const elapsed = draft?.elapsed ?? 0;
    setTimeLeft(totalTime - Math.floor(elapsed / 1000));
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleForceSubmit();
          return 0;
        }
        return prev - 1;
      });
      updateElapsed(Date.now() - startRef.current);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timerEnabled]);

  const handleForceSubmit = useCallback(() => {
    clearInterval(timerRef.current);
    recordCurrentQuestionTime();
    setShowPopup(true);
  }, []);

  const recordCurrentQuestionTime = () => {
    if (!draft || !draft.questions || draft.questions.length === 0) return;
    const currentQ = draft.questions[currentIdx];
    const timeSpentMs = Date.now() - questionEntryTimeRef.current;
    if (timeSpentMs > 500) { // Only record if spent more than 500ms
      updateTimeSpent(currentQ.id, timeSpentMs);
    }
    questionEntryTimeRef.current = Date.now();
  };

  const navigateToQuestion = (newIdx) => {
    recordCurrentQuestionTime();
    setCurrentIdx(newIdx);
  };

  const handleAnswer = (questionId, answer) => {
    saveAnswer(questionId, answer);
  };

  const handleToggleRagu = (questionId) => {
    toggleRagu(questionId);
  };

  const handleSubmit = () => {
    clearInterval(timerRef.current);
    recordCurrentQuestionTime();
    setShowPopup(true);
  };

  const handleMetacogComplete = (reasons) => {
    const session = submitSession(reasons);
    setSubmittedSession(session);
    setShowPopup(false);
    navigate(`/review/${session.code}`);
  };

  if (!draft || questions.length === 0) return null;

  const q = questions[currentIdx];
  const answered = questions.filter(sq => isAnswered(sq, answers[sq.id])).length;
  const typeCfg = getQuestionTypeConfig(q.questionType);
  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  };
  const timePct = timerEnabled && timeLeft !== null ? (timeLeft / totalTime) * 100 : 100;
  const timeWarning = timerEnabled && timeLeft !== null && timeLeft < 120;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--gray-50)' }}>

      {/* ─ TOP BAR ────────────────────────────────────── */}
      <div style={{
        background: 'white',
        borderBottom: '1.5px solid var(--sky-100)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
        flexShrink: 0,
      }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            SESI UJIAN
          </p>
          <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--sky-700)', fontWeight: 700 }}>
            {draft.code}
          </p>
        </div>

        <div style={{ flex: 1, maxWidth: 300 }}>
          <div className="flex justify-between mb-4">
            <span className="text-xs text-muted">Progress</span>
            <span className="text-xs font-semibold text-sky">{answered}/{questions.length}</span>
          </div>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
        </div>

        {timerEnabled && timeLeft !== null && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 16px',
            borderRadius: 8,
            background: timeWarning ? '#fef2f2' : 'var(--sky-50)',
            border: `1.5px solid ${timeWarning ? '#fca5a5' : 'var(--sky-200)'}`,
          }}>
            <span style={{ fontSize: 18 }}>{timeWarning ? '🚨' : '⏱'}</span>
            <span style={{
              fontSize: 20, fontWeight: 800, fontFamily: 'monospace',
              color: timeWarning ? 'var(--error)' : 'var(--sky-700)',
              animation: timeWarning ? 'pulse 1s infinite' : 'none',
            }}>
              {formatTime(timeLeft)}
            </span>
          </div>
        )}

        <button className="btn btn-danger btn-sm" onClick={handleSubmit}>
          ✅ Kumpulkan
        </button>
      </div>

      {/* ─ MAIN SPLIT SCREEN ──────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Stimulus & Navigator */}
        <div style={{
          width: 340, flexShrink: 0,
          background: 'white',
          borderRight: '1.5px solid var(--sky-100)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Stimulus */}
          <div style={{ flex: 1, padding: 20, overflowY: 'auto' }}>
            <div className="flex items-center gap-8 mb-12">
              <span className="badge badge-sky">
                {SUBJECTS[q.subject]?.icon} {SUBJECTS[q.subject]?.code}
              </span>
              <span className={`badge ${q.difficulty === 1 ? 'badge-green' : q.difficulty === 2 ? 'badge-yellow' : 'badge-red'}`}>
                {'⭐'.repeat(q.difficulty)} {q.difficulty === 1 ? 'Mudah' : q.difficulty === 2 ? 'Sedang' : 'Sulit'}
              </span>
              <span className="badge badge-yellow" title={typeCfg.label}>
                {typeCfg.icon} {typeCfg.shortLabel}
              </span>
            </div>
            {q.stimulus ? (
              <>
                <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--sky-600)', letterSpacing: '0.05em', marginBottom: 8 }}>
                  STIMULUS / BACAAN
                </p>
                <div style={{
                  background: 'var(--sky-50)',
                  border: '1.5px solid var(--sky-200)',
                  borderRadius: 8,
                  padding: 14,
                  fontSize: 13,
                  lineHeight: 1.7,
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                }}>
                  {q.stimulus}
                </div>
              </>
            ) : (
              <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📐</div>
                <p className="text-sm">Soal mandiri (tanpa bacaan)</p>
              </div>
            )}
          </div>

          {/* Question Navigator */}
          <div style={{
            padding: 16,
            borderTop: '1.5px solid var(--sky-100)',
            background: 'var(--gray-50)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 10, letterSpacing: '0.05em' }}>
              NAVIGATOR SOAL
            </p>
            <div className="nav-grid" style={{ gridTemplateColumns: `repeat(${Math.min(8, questions.length)}, 1fr)` }}>
              {questions.map((sq, i) => (
                <div
                  key={sq.id}
                  className={`nav-cell ${isAnswered(sq, answers[sq.id]) ? 'answered' : ''} ${ragu[sq.id] ? 'ragu' : ''} ${i === currentIdx ? 'current' : ''}`}
                  onClick={() => navigateToQuestion(i)}
                  title={`Soal ${i + 1}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="flex gap-12 mt-10" style={{ flexWrap: 'wrap' }}>
              {[
                { color: 'var(--sky-500)', label: `Dijawab (${answered})` },
                { color: 'var(--warning)', label: `Ragu (${Object.values(ragu).filter(Boolean).length})` },
                { color: 'var(--border)', label: 'Belum' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-4">
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Question & Options */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>

            {/* Question Number & Text */}
            <div className="flex items-center gap-12 mb-20">
              <div style={{
                width: 44, height: 44,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--sky-500), var(--sky-700))',
                color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 16, flexShrink: 0,
              }}>
                {currentIdx + 1}
              </div>
              <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                {q.question}
              </p>
            </div>

            {/* Answer Input by Type */}
            <QuestionInput
              question={q}
              userAnswer={answers[q.id]}
              onChange={(val) => handleAnswer(q.id, val)}
            />

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-28" style={{ marginTop: 28 }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigateToQuestion(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
              >
                ← Sebelumnya
              </button>

              <button
                className={`btn ${ragu[q.id] ? 'btn-danger' : 'btn-ghost'}`}
                onClick={() => handleToggleRagu(q.id)}
                style={{ fontSize: 13 }}
              >
                {ragu[q.id] ? '🚩 Ragu-ragu' : '🏳 Tandai Ragu'}
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  className="btn btn-primary"
                  onClick={() => navigateToQuestion(currentIdx + 1)}
                >
                  Selanjutnya →
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleSubmit}>
                  ✅ Selesai & Kumpulkan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─ METAKOGNITIVE POPUP ────────────────────────── */}
      {showPopup && (
        <MetakognitifPopup
          questions={questions}
          answers={answers}
          onComplete={handleMetacogComplete}
        />
      )}
    </div>
  );
}
