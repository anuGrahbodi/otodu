import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SUBJECTS, getQuestionsBySubjects, generateDraftCode } from '../data/questions';

const ALL_SUBJECTS = Object.keys(SUBJECTS);

export default function SetupUjian() {
  const navigate = useNavigate();
  const { mastery, activeDraft, createSession, discardDraft } = useStore();

  // Defaults: weaker subjects auto-checked
  const weakDefault = ALL_SUBJECTS.filter(k => mastery[k] < 0.65);
  const [selected, setSelected] = useState(
    weakDefault.length > 0 ? weakDefault : ALL_SUBJECTS.slice(0, 3)
  );
  const [soalPerMateri, setSoalPerMateri] = useState(5);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [showDraftAlert, setShowDraftAlert] = useState(!!activeDraft);

  const toggleSubject = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const totalSoal = selected.length * soalPerMateri;

  const handleStart = () => {
    if (selected.length === 0) return;
    const questions = getQuestionsBySubjects(selected, soalPerMateri);
    const code = generateDraftCode(selected);
    createSession(code, questions, selected, timerEnabled, soalPerMateri);
    navigate(`/ujian/${code}`);
  };

  const handleResumeDraft = () => {
    navigate(`/ujian/${activeDraft.code}`);
  };

  return (
    <div className="page animate-fade">
      <div className="container" style={{ maxWidth: 760, paddingTop: 40 }}>

        <h1 className="title-lg">📝 Persiapan Sesi Ujian</h1>
        <p className="text-muted mt-8">
          Sistem merekomendasikan materi berdasarkan diagnosis DINA kamu.
        </p>

        {/* ─ DRAFT ALERT ─────────────────────────────── */}
        {showDraftAlert && activeDraft && (
          <div className="alert alert-warning mt-20" style={{ alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Draft Sesi Belum Selesai!</p>
              <p className="text-sm mt-4" style={{ fontFamily: 'monospace', color: 'var(--gray-600)' }}>
                {activeDraft.code}
              </p>
              <p className="text-xs mt-4" style={{ color: '#92400e' }}>
                {activeDraft.questions?.length} soal · {activeDraft.subjects?.map(k => SUBJECTS[k]?.label).join(', ')}
              </p>
              <div className="flex gap-8 mt-12">
                <button className="btn btn-sm btn-primary" onClick={handleResumeDraft}>
                  ▶ Lanjutkan Draft
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  style={{ color: 'var(--error)' }}
                  onClick={() => { discardDraft(); setShowDraftAlert(false); }}
                >
                  🗑 Buang Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─ SUBJECT SELECTION ────────────────────────── */}
        <div className="card mt-24">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="title-sm">📚 Pilih Materi</h2>
              <p className="text-xs text-muted mt-4">
                ✨ Materi tercentang otomatis berdasarkan mastery &lt;65%
              </p>
            </div>
            <span className="badge badge-sky">{selected.length} dipilih</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ALL_SUBJECTS.map(key => {
              const s = SUBJECTS[key];
              const pct = Math.round((mastery[key] ?? 0.5) * 100);
              const isChecked = selected.includes(key);
              const isWeak = pct < 65;
              return (
                <div
                  key={key}
                  className={`checkbox-item ${isChecked ? 'checked' : ''}`}
                  onClick={() => toggleSubject(key)}
                >
                  <div className={`checkbox-icon ${isChecked ? 'checked' : ''}`}>
                    {isChecked && <span style={{ fontSize: 12 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center justify-between">
                      <span style={{ fontWeight: 600, fontSize: 14 }}>
                        {s.icon} {s.label}
                      </span>
                      <div className="flex items-center gap-8">
                        {isWeak && (
                          <span className="badge badge-red" style={{ fontSize: 11 }}>
                            ⚠ Lemah
                          </span>
                        )}
                        <span
                          className={`badge ${pct < 50 ? 'badge-red' : pct < 70 ? 'badge-yellow' : 'badge-green'}`}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="progress-wrap mt-8" style={{ height: 6 }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct < 50
                            ? 'linear-gradient(90deg, #ef4444, #f97316)'
                            : pct < 70
                              ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                              : 'linear-gradient(90deg, #22c55e, #16a34a)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─ SOAL COUNT ───────────────────────────────── */}
        <div className="card mt-16">
          <h2 className="title-sm mb-16">🔢 Jumlah Soal per Materi</h2>
          <div className="flex items-center gap-20">
            <input
              type="range" min={3} max={10} value={soalPerMateri}
              onChange={e => setSoalPerMateri(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <div style={{
              minWidth: 80, textAlign: 'center',
              background: 'var(--sky-100)', borderRadius: 8, padding: '10px 16px',
              fontWeight: 800, fontSize: 20, color: 'var(--sky-700)',
            }}>
              {soalPerMateri}
            </div>
          </div>
          <div className="flex justify-between mt-8">
            <span className="text-xs text-muted">Minimum: 3</span>
            <span className="text-xs text-muted">Maksimum: 10</span>
          </div>
          <div className="alert alert-info mt-16">
            <span>📊</span>
            <p className="text-sm">
              Total: <strong>{selected.length} materi × {soalPerMateri} soal = {totalSoal} soal</strong>
              {' '}· Estimasi waktu: ~{Math.ceil(totalSoal * 1.5)} menit
            </p>
          </div>
        </div>

        {/* ─ TIMER TOGGLE ─────────────────────────────── */}
        <div className="card mt-16">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="title-sm">⏱ Timer</h2>
              <p className="text-xs text-muted mt-4">
                {timerEnabled
                  ? 'Timer aktif. Kecepatan mempengaruhi skor kemahiran.'
                  : 'Timer dimatikan. Fokus pada pemahaman konsep, skor kecepatan tidak dihitung.'}
              </p>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={timerEnabled}
                onChange={e => setTimerEnabled(e.target.checked)}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          {timerEnabled && (
            <div className="alert alert-info mt-12">
              <span>⚡</span>
              <p className="text-sm">
                Waktu total: <strong>{totalSoal * 90} detik</strong> ({totalSoal} soal × 90 detik/soal)
              </p>
            </div>
          )}
        </div>

        {/* ─ EXECUTE BUTTON ────────────────────────────── */}
        <div className="mt-24">
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleStart}
            disabled={selected.length === 0}
          >
            🚀 Mulai Sesi Ujian ({totalSoal} Soal)
          </button>
          {selected.length === 0 && (
            <p className="text-xs text-muted text-center mt-8">
              Pilih minimal 1 materi untuk memulai sesi.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
