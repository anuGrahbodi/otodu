import { useState } from 'react';
import { SUBJECTS } from '../data/questions';

const REASONS = [
  { key: 'tidak_tau',    emoji: '🤔', label: 'Beneran ga tau konsepnya sama sekali', sub: 'Penalti mastery besar' },
  { key: 'lupa_rumus',   emoji: '🧠', label: 'Pernah belajar, tapi lupa rumusnya', sub: 'Butuh spaced repetition' },
  { key: 'panik',        emoji: '⏳', label: 'Panik / Kehabisan waktu', sub: 'Masalah pacing' },
  { key: 'terkecoh',     emoji: '🤡', label: 'Terkecoh / Kirain benar ternyata salah', sub: 'Indikasi miskonsepsi' },
  { key: 'salah_pencet', emoji: '👆', label: 'Salah pencet / Typo', sub: 'Parameter Slip, penalti kecil' },
];

export default function MetakognitifPopup({ questions, answers, onComplete }) {
  const wrongQuestions = questions.filter(q => answers[q.id] !== q.answer);
  const [reasons, setReasons] = useState({});
  const [currentWrongIdx, setCurrentWrongIdx] = useState(0);

  const setReason = (questionId, reason) => {
    setReasons(prev => ({ ...prev, [questionId]: reason }));
  };

  const allAnswered = wrongQuestions.every(q => reasons[q.id]);
  const currentWrong = wrongQuestions[currentWrongIdx];

  if (wrongQuestions.length === 0) {
    return (
      <div className="modal-overlay">
        <div className="modal-box" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div className="modal-body" style={{ padding: 48 }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h2 className="title-lg" style={{ color: 'var(--success)' }}>Sempurna!</h2>
            <p className="text-muted mt-12">Kamu menjawab semua soal dengan benar!</p>
            <button
              className="btn btn-primary btn-lg mt-24"
              onClick={() => onComplete({})}
            >
              Lihat Rapor →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-header">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="title-md">📊 Evaluasi Metakognitif</h2>
              <p className="text-sm text-muted mt-4">
                Bantu kami memahami mengapa kamu salah — ini meningkatkan akurasi rekomendasi DINA-mu.
              </p>
            </div>
            <span className="badge badge-red">{wrongQuestions.length} soal salah</span>
          </div>

          {/* Progress through wrong questions */}
          {wrongQuestions.length > 1 && (
            <div className="mt-16">
              <div className="flex justify-between mb-4">
                <span className="text-xs text-muted">
                  Soal {currentWrongIdx + 1} dari {wrongQuestions.length}
                </span>
                <span className="text-xs font-semibold text-sky">
                  {Object.keys(reasons).length}/{wrongQuestions.length} diisi
                </span>
              </div>
              <div className="progress-wrap">
                <div
                  className="progress-fill"
                  style={{ width: `${(Object.keys(reasons).length / wrongQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-body">
          {currentWrong && (
            <div>
              {/* Wrong Question Info */}
              <div style={{
                background: 'var(--error-bg)',
                border: '1.5px solid #fca5a5',
                borderRadius: 10,
                padding: '14px 18px',
                marginBottom: 20,
              }}>
                <div className="flex items-center gap-8 mb-8">
                  <span className="badge badge-red">Soal No. {questions.indexOf(currentWrong) + 1}</span>
                  <span className="badge badge-sky">
                    {SUBJECTS[currentWrong.subject]?.icon} {SUBJECTS[currentWrong.subject]?.label}
                  </span>
                </div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 10 }}>
                  <strong>Soal:</strong> {currentWrong.question}
                </p>
                <div className="flex gap-16">
                  <p className="text-sm">
                    <span style={{ color: 'var(--error)' }}>❌ Jawabanmu:</span>{' '}
                    <strong>{answers[currentWrong.id] ?? '(Tidak dijawab)'}</strong>
                  </p>
                  <p className="text-sm">
                    <span style={{ color: 'var(--success)' }}>✅ Kunci:</span>{' '}
                    <strong>{currentWrong.answer}</strong>
                  </p>
                </div>
              </div>

              {/* Reason Selection */}
              <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
                Kenapa kamu salah menjawab soal ini?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {REASONS.map(r => {
                  const isSelected = reasons[currentWrong.id] === r.key;
                  return (
                    <div
                      key={r.key}
                      onClick={() => setReason(currentWrong.id, r.key)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: `2px solid ${isSelected ? 'var(--sky-500)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--sky-50)' : 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 24, flexShrink: 0 }}>{r.emoji}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 600, fontSize: 13, color: isSelected ? 'var(--sky-700)' : 'var(--text-primary)' }}>
                          {r.label}
                        </p>
                        <p style={{ fontSize: 11, color: isSelected ? 'var(--sky-600)' : 'var(--text-muted)', marginTop: 2 }}>
                          {r.sub}
                        </p>
                      </div>
                      <div style={{
                        width: 20, height: 20,
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--sky-500)' : 'var(--border)'}`,
                        background: isSelected ? 'var(--sky-500)' : 'white',
                        flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {isSelected && <span style={{ color: 'white', fontSize: 10 }}>✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="flex justify-between items-center gap-12">
            {/* All wrong Q cards tabs */}
            {wrongQuestions.length > 1 && (
              <div className="flex gap-6">
                {wrongQuestions.map((wq, i) => (
                  <button
                    key={wq.id}
                    onClick={() => setCurrentWrongIdx(i)}
                    style={{
                      width: 28, height: 28,
                      borderRadius: '50%',
                      border: `2px solid ${reasons[wq.id] ? 'var(--success)' : i === currentWrongIdx ? 'var(--sky-500)' : 'var(--border)'}`,
                      background: reasons[wq.id] ? 'var(--success)' : i === currentWrongIdx ? 'var(--sky-100)' : 'white',
                      color: reasons[wq.id] ? 'white' : 'var(--text-primary)',
                      fontSize: 11, fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}

            <div className="flex gap-8" style={{ marginLeft: 'auto' }}>
              {currentWrongIdx < wrongQuestions.length - 1 ? (
                <button
                  className="btn btn-secondary"
                  onClick={() => setCurrentWrongIdx(i => i + 1)}
                  disabled={!reasons[currentWrong?.id]}
                >
                  Soal Berikutnya →
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => onComplete(reasons)}
                  disabled={!allAnswered}
                >
                  🚀 Lihat Rapor & Pembahasan
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
