import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SUBJECTS } from '../data/questions';

const REASON_LABELS = {
  tidak_tau:    { emoji: '🤔', text: 'Beneran ga tau konsepnya', color: 'var(--error)' },
  lupa_rumus:   { emoji: '🧠', text: 'Pernah belajar, tapi lupa', color: '#f59e0b' },
  panik:        { emoji: '⏳', text: 'Panik / Kehabisan waktu', color: '#8b5cf6' },
  terkecoh:     { emoji: '🤡', text: 'Terkecoh / Miskonsepsi', color: '#f97316' },
  salah_pencet: { emoji: '👆', text: 'Salah pencet / Typo', color: 'var(--sky-600)' },
};

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}m ${s}s`;
}

function ScoreMeter({ score }) {
  const color = score >= 80 ? 'var(--success)' : score >= 60 ? 'var(--warning)' : 'var(--error)';
  const label = score >= 80 ? 'Mahir' : score >= 60 ? 'Berkembang' : 'Perlu Belajar';
  return (
    <div style={{ textAlign: 'center', padding: '32px 24px' }}>
      <div style={{
        width: 140, height: 140,
        borderRadius: '50%',
        background: `conic-gradient(${color} ${score * 3.6}deg, var(--sky-100) 0deg)`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        boxShadow: `0 0 0 8px white, 0 0 0 10px ${color}30`,
      }}>
        <div style={{
          width: 110, height: 110,
          background: 'white',
          borderRadius: '50%',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          position: 'absolute',
        }}>
          <span style={{ fontSize: 32, fontWeight: 900, color }}>{score}%</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginTop: 2 }}>{label}</span>
        </div>
      </div>
      <p style={{ marginTop: 12, fontWeight: 700, fontSize: 16 }}>Level Kemahiran Sesi Ini</p>
      <p className="text-xs text-muted mt-4">Berdasarkan kebenaran + kecepatan + bobot kesulitan DINA</p>
    </div>
  );
}

export default function ReviewSesi() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { sessions } = useStore();

  const session = sessions.find(s => s.code === sessionId);

  if (!session) {
    return (
      <div className="page animate-fade">
        <div className="container" style={{ paddingTop: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>🔍</div>
          <h2 className="title-md mt-16">Sesi tidak ditemukan</h2>
          <p className="text-muted mt-8">Kode sesi mungkin sudah kedaluwarsa atau belum ada.</p>
          <button className="btn btn-primary mt-24" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { results, correct, totalQuestions, elapsed, skillScore, timerEnabled, subjects } = session;
  const wrong = results.filter(r => !r.isCorrect);
  const correctResults = results.filter(r => r.isCorrect);

  return (
    <div className="page animate-fade">
      <div className="container" style={{ maxWidth: 820, paddingTop: 32 }}>

        {/* HEADER */}
        <div className="flex items-center justify-between mb-24">
          <div>
            <p className="text-xs text-muted" style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>
              📋 {session.code}
            </p>
            <h1 className="title-lg mt-4">Rapor & Pembahasan</h1>
          </div>
          <div className="flex gap-8">
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/setup-ujian')}>
              📝 Sesi Baru
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/statistik')}>
              📊 Statistik
            </button>
          </div>
        </div>

        {/* SCORE + STATS */}
        <div className="card card-glass" style={{ borderColor: 'var(--sky-200)' }}>
          <div className="grid-3 grid" style={{ alignItems: 'center' }}>
            <ScoreMeter score={skillScore} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 0' }}>
              {[
                { icon: '✅', label: 'Benar', value: `${correct}/${totalQuestions}`, color: 'var(--success)' },
                { icon: '❌', label: 'Salah', value: `${wrong.length}/${totalQuestions}`, color: 'var(--error)' },
                { icon: '⏱', label: 'Waktu', value: formatTime(elapsed), color: 'var(--sky-600)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>
                  <div>
                    <p className="text-xs text-muted">{s.label}</p>
                    <p style={{ fontWeight: 800, fontSize: 18, color: s.color }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                MATERI DIUJI
              </p>
              {subjects.map(k => {
                const s = SUBJECTS[k];
                const subjectResults = results.filter(r => r.subject === k);
                const subj_correct = subjectResults.filter(r => r.isCorrect).length;
                return (
                  <div key={k} className="flex items-center gap-8">
                    <span>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600 }}>{s.label}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {subj_correct}/{subjectResults.length} benar
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* COMMUNITY STATS */}
        <div className="card mt-20" style={{ background: 'linear-gradient(135deg, #1e293b, #0c4a6e)', borderColor: 'transparent' }}>
          <div className="flex items-center gap-12 mb-16">
            <span style={{ fontSize: 24 }}>👥</span>
            <div>
              <p style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Statistik Komunitas</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                Dibandingkan dengan {(12450).toLocaleString('id')} pejuang UTBK hari ini
              </p>
            </div>
          </div>
          <div className="grid-3 grid gap-16">
            {[
              {
                icon: '🎯',
                label: `${Math.round((correct / totalQuestions) * 100)}%`,
                sub: 'Akurasi kamu',
                compare: 'Rata-rata komunitas: 67%',
                good: correct / totalQuestions >= 0.67,
              },
              {
                icon: '⚡',
                label: timerEnabled ? `${Math.round(elapsed / 1000 / totalQuestions)}s` : 'N/A',
                sub: 'Rata-rata per soal',
                compare: timerEnabled ? 'Rata-rata komunitas: 85s' : 'Timer tidak aktif',
                good: timerEnabled && elapsed / 1000 / totalQuestions < 85,
              },
              {
                icon: '🏆',
                label: `${skillScore}%`,
                sub: 'Skor kemahiran DINA',
                compare: 'Top 25%: ≥80%',
                good: skillScore >= 80,
              },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 12,
                padding: '16px',
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                <p style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</p>
                <p style={{ fontSize: 24, fontWeight: 900, color: s.good ? '#4ade80' : '#fb923c' }}>{s.label}</p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>{s.sub}</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>{s.compare}</p>
              </div>
            ))}
          </div>
        </div>

        {/* QUESTION REVIEW LIST */}
        <div className="mt-24">
          <h2 className="title-md mb-16">📋 Pembahasan Soal</h2>

          {results.map((r, i) => {
            const reasonData = r.reason ? REASON_LABELS[r.reason] : null;
            const communityCorrect = Math.round(r.communityStats.correctRate * 100);
            const communityOntime = Math.round(r.communityStats.ontimeRate * 100);

            return (
              <div
                key={r.id}
                className={`review-card ${r.isCorrect ? 'correct' : 'wrong'}`}
              >
                <div className="flex items-center justify-between mb-12">
                  <div className="flex items-center gap-10">
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: r.isCorrect ? 'var(--success)' : 'var(--error)',
                      color: 'white', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0,
                    }}>
                      {i + 1}
                    </div>
                    <div>
                      <span className="badge badge-sky" style={{ marginRight: 6 }}>
                        {SUBJECTS[r.subject]?.icon} {SUBJECTS[r.subject]?.label}
                      </span>
                      <span className={`badge ${r.difficulty === 1 ? 'badge-green' : r.difficulty === 2 ? 'badge-yellow' : 'badge-red'}`}>
                        {'⭐'.repeat(r.difficulty)}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-8">
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      👥 {communityCorrect}% benar
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ⚡ {communityOntime}% on-time
                    </span>
                  </div>
                </div>

                {r.stimulus && (
                  <div style={{
                    background: 'var(--sky-50)', borderLeft: '3px solid var(--sky-400)',
                    borderRadius: '0 6px 6px 0', padding: '10px 14px',
                    fontSize: 12, lineHeight: 1.6, fontStyle: 'italic',
                    color: 'var(--gray-600)', marginBottom: 12,
                  }}>
                    {r.stimulus}
                  </div>
                )}

                <p style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.5, marginBottom: 12 }}>
                  {r.question}
                </p>

                <div className="flex gap-16 mb-12">
                  <div style={{
                    padding: '6px 12px', borderRadius: 6,
                    background: r.isCorrect ? 'var(--success-bg)' : 'var(--error-bg)',
                    border: `1px solid ${r.isCorrect ? '#86efac' : '#fca5a5'}`,
                    fontSize: 13,
                  }}>
                    <span style={{ color: 'var(--text-muted)' }}>Jawabanmu: </span>
                    <strong style={{ color: r.isCorrect ? 'var(--success)' : 'var(--error)' }}>
                      {r.userAnswer ?? '(Tidak dijawab)'}
                    </strong>
                    {' '}{r.isCorrect ? '✅' : '❌'}
                  </div>
                  {!r.isCorrect && (
                    <div style={{
                      padding: '6px 12px', borderRadius: 6,
                      background: 'var(--success-bg)', border: '1px solid #86efac',
                      fontSize: 13,
                    }}>
                      <span style={{ color: 'var(--text-muted)' }}>Jawaban benar: </span>
                      <strong style={{ color: 'var(--success)' }}>{r.answer} ✅</strong>
                    </div>
                  )}
                </div>

                {/* Metacog Reason - only for wrong */}
                {!r.isCorrect && reasonData && (
                  <div style={{
                    background: '#fff7ed', border: '1.5px solid #fed7aa',
                    borderRadius: 8, padding: '10px 14px', marginBottom: 12,
                    fontSize: 13,
                  }}>
                    <p style={{ fontWeight: 700, color: '#c2410c' }}>
                      {reasonData.emoji} Kamu salah karena: "{reasonData.text}"
                    </p>
                    <p style={{ color: '#78350f', marginTop: 4, lineHeight: 1.5 }}>
                      {r.reason === 'tidak_tau' && 'Saatnya belajar dari awal. Simak pembahasan di bawah dan jadwalkan review ulang!'}
                      {r.reason === 'lupa_rumus' && 'Spaced repetition akan membantu. Buat catatan singkat dan review setiap 3 hari.'}
                      {r.reason === 'panik' && 'Latih manajemen waktu. Coba kerjakan soal mudah dulu sebelum yang sulit.'}
                      {r.reason === 'terkecoh' && 'Miskonsepsi perlu diluruskan. Baca kunci alasan di bawah dengan cermat.'}
                      {r.reason === 'salah_pencet' && 'Lebih hati-hati! Ini slip kecil, mastery-mu tidak terlalu terpengaruh.'}
                    </p>
                  </div>
                )}

                {/* Explanation */}
                <div style={{
                  background: 'var(--sky-50)', border: '1.5px solid var(--sky-200)',
                  borderRadius: 8, padding: '12px 16px', marginBottom: 10,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--sky-700)', marginBottom: 6 }}>
                    💡 PEMBAHASAN
                  </p>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-primary)' }}>
                    {r.explanation}
                  </p>
                </div>

                {/* Distractor analysis for wrong answers */}
                {!r.isCorrect && r.distractorAnalysis && r.userAnswer && r.distractorAnalysis[r.userAnswer] && (
                  <div style={{
                    background: '#fef9c3', border: '1px solid #fde68a',
                    borderRadius: 8, padding: '10px 14px',
                  }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#a16207', marginBottom: 4 }}>
                      🔍 Analisis Opsi {r.userAnswer} (yang kamu pilih)
                    </p>
                    <p style={{ fontSize: 13, lineHeight: 1.6, color: '#78350f' }}>
                      {r.distractorAnalysis[r.userAnswer]}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-12 mt-32" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => navigate('/setup-ujian')}>
            🚀 Mulai Sesi Baru
          </button>
          <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
            🏠 Kembali ke Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
