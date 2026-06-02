import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SUBJECTS, getAdaptiveQuestions, getQuestionsBySubjectsTotal, distributeSoalCounts, generateDraftCode } from '../data/questions';

const ALL_SUBJECTS = Object.keys(SUBJECTS);

function getRecommendedSubjects(mastery) {
  return [...ALL_SUBJECTS]
    .sort((a, b) => (mastery[a] ?? 0.5) - (mastery[b] ?? 0.5))
    .slice(0, 2); // Ambil 2 topik terlemah
}

export default function SetupUjian() {
  const navigate = useNavigate();
  const { mastery, activeDraft, createSession, discardDraft } = useStore();

  const recommendedSubjects = useMemo(() => getRecommendedSubjects(mastery), [mastery]);

  const [setupMode, setSetupMode] = useState('rekomendasi');
  const [selected, setSelected] = useState(recommendedSubjects);
  const [totalSoal, setTotalSoal] = useState(5);
  const [apiUrl, setApiUrl] = useState('');
  const [isStarting, setIsStarting] = useState(false);
  const hasActiveDraft = !!activeDraft;

  const isRekomendasi = setupMode === 'rekomendasi';
  const activeSubjects = isRekomendasi ? recommendedSubjects : selected;
  const minTotalSoal = Math.max(activeSubjects.length, 5);
  const maxTotalSoal = Math.max(minTotalSoal, 50);
  const distribution = distributeSoalCounts(totalSoal, activeSubjects.length);
  const minPerMateri = distribution.length ? Math.min(...distribution) : 0;
  const maxPerMateri = distribution.length ? Math.max(...distribution) : 0;
  const perMateriLabel = minPerMateri === maxPerMateri
    ? `${minPerMateri} soal per materi`
    : `${minPerMateri}–${maxPerMateri} soal per materi`;

  useEffect(() => {
    const min = Math.max(activeSubjects.length, 5);
    const max = Math.max(min, 50);
    setTotalSoal(prev => Math.min(Math.max(prev, min), max));
  }, [activeSubjects.length]);

  const toggleSubject = (key) => {
    setSelected(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleStart = async () => {
    if (hasActiveDraft || activeSubjects.length === 0 || isStarting) return;
    setIsStarting(true);
    let finalQuestions = [];

    const storeState = useStore.getState();
    const fallbackQuestions = getAdaptiveQuestions(activeSubjects, totalSoal, storeState);
    const avgPerMateri = Math.ceil(totalSoal / activeSubjects.length);

    if (apiUrl) {
      try {
        const url = new URL(apiUrl);
        url.searchParams.set('subjects', activeSubjects.join(','));
        url.searchParams.set('limit', totalSoal.toString());
        
        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        
        const data = await res.json();
        const apiQuestions = Array.isArray(data) ? data : (data.data || data.questions);
        
        if (!apiQuestions || apiQuestions.length === 0) {
          throw new Error('Response API kosong');
        }

        finalQuestions = apiQuestions.map((q, i) => ({
          id: q.id || `API-${Date.now()}-${i}`,
          subject: q.subject || activeSubjects[i % activeSubjects.length],
          subtest: q.subtest || 'PU',
          questionType: q.questionType || 'pg',
          difficulty: q.difficulty || 2,
          idealTime: q.idealTime || 90,
          stimulus: q.stimulus || '',
          question: q.question || '[Soal dari API tidak memiliki teks]',
          options: q.options || ['A', 'B', 'C', 'D', 'E'],
          statements: q.statements || [],
          answer: q.answer || 'A',
          explanation: q.explanation || '',
          source: q.source || 'API Eksternal',
        }));
      } catch (err) {
        console.error('API Fetch Error:', err);
        alert('Gagal mengambil soal dari API. Sistem akan menjalankan soal dummy (lokal) sebagai gantinya.');
        finalQuestions = fallbackQuestions;
      }
    } else {
      finalQuestions = fallbackQuestions;
    }

    const code = generateDraftCode(activeSubjects);
    createSession(code, finalQuestions, activeSubjects, false, avgPerMateri);
    setIsStarting(false);
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
          {isRekomendasi
            ? 'Sistem akan memilih materi paling sesuai berdasarkan kemampuanmu saat ini.'
            : 'Pilih materi dan jumlah soal sesuai kebutuhan belajarmu.'}
        </p>

        {hasActiveDraft && activeDraft && (
          <div className="alert alert-warning mt-20" style={{ alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 14 }}>Draft Sesi Belum Selesai!</p>
              <p className="text-sm mt-4">
                Selesaikan atau buang draft terlebih dahulu sebelum memulai sesi ujian baru.
              </p>
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
                  onClick={() => discardDraft()}
                >
                  🗑 Buang Draft
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─ MODE PILIHAN ──────────────────────────────── */}
        <div className="card mt-24">
          <h2 className="title-sm mb-12">🎯 Mode Sesi</h2>
          <div className="grid grid-2 gap-12">
            {[
              {
                id: 'rekomendasi',
                label: '✨ Rekomendasi Sistem',
                desc: (
                  <>
                    Materi dipilih otomatis sesuai kebutuhan belajarmu dan riwayat pengerjaan soal-soal sebelumnya.{' '}
                    <span 
                      title="Sistem kami mempertimbangkan parameter berikut: rata-rata durasi kecepatan pengerjaan tiap soal, tingkat ketepatan pada topik tertentu (materi akan disesuaikan secara spesifik hingga ke level sub-materi dan poin terkecilnya), seberapa lama sejak terakhir berlatih, alasan metakognitif saat menjawab salah, dan sebaran variasi tipe soal." 
                      style={{ cursor: 'help', color: 'var(--sky-500)', fontWeight: 800, background: 'var(--sky-100)', padding: '0 4px', borderRadius: 4 }}
                    >
                      ?
                    </span>
                  </>
                ),
              },
              {
                id: 'kustom',
                label: '🛠 Kustom',
                desc: 'Pilih materi sendiri sesuai mood kamu.',
              },
            ].map(mode => (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSetupMode(mode.id)}
                style={{
                  padding: '16px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${setupMode === mode.id ? 'var(--sky-500)' : 'var(--border)'}`,
                  background: setupMode === mode.id ? 'var(--sky-50)' : 'var(--surface)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition)',
                }}
              >
                <p style={{ fontWeight: 700, fontSize: 14 }}>{mode.label}</p>
                <p className="text-xs text-muted mt-4" style={{ lineHeight: 1.5 }}>{mode.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* ─ API LINK ──────────────────────────────────── */}
        <div className="card mt-16">
          <h2 className="title-sm mb-8">🔗 Link Sumber Soal (GET API)</h2>
          <p className="text-sm text-muted mb-16">
            Masukkan link API untuk mengambil soal secara dinamis. Biarkan kosong untuk menggunakan soal lokal (dummy).
          </p>
          <input
            type="text"
            className="input w-full"
            placeholder="https://api.example.com/get-soal"
            value={apiUrl}
            onChange={e => setApiUrl(e.target.value)}
          />
          {apiUrl && (
            <div className="mt-12 p-12 bg-gray-50 rounded border text-xs" style={{ wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--gray-600)' }}>
              <strong>URL Request Final:</strong><br/>
              {(() => {
                try {
                  const url = new URL(apiUrl);
                  url.searchParams.set('subjects', activeSubjects.join(','));
                  url.searchParams.set('limit', totalSoal.toString());
                  return url.toString();
                } catch {
                  return <span style={{ color: 'var(--error)' }}>URL tidak valid</span>;
                }
              })()}
            </div>
          )}
        </div>

        {/* ─ REKOMENDASI SISTEM ──────────────────────── */}
        {isRekomendasi && (
          <div className="card mt-16">
            <h2 className="title-sm mb-8">✨ Materi Rekomendasi</h2>
            <p className="text-sm text-muted mb-16">
              Sistem memilih {recommendedSubjects.length} materi berdasarkan titik lemah dan kemampuanmu.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recommendedSubjects.map(key => (
                <span key={key} className="badge badge-sky">
                  {SUBJECTS[key].icon} {SUBJECTS[key].label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ─ PILIH MATERI (KUSTOM) ───────────────────── */}
        {!isRekomendasi && (
          <div className="card mt-16">
            <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="title-sm">📚 Pilih Materi</h2>
                <p className="text-xs text-muted mt-4">
                  Centang materi yang ingin kamu kerjakan
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
                          {/* Labels or badges can go here in the future */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─ TOTAL SOAL ───────────────────────────────── */}
        <div className="card mt-16">
          <h2 className="title-sm mb-8">🔢 Jumlah Soal Total</h2>
          <p className="text-sm text-muted mb-16">
            Total keseluruhan soal akan dibagi rata ke setiap materi yang dipilih.
          </p>

          <div className="flex items-center gap-20">
            <input
              type="range"
              min={minTotalSoal}
              max={maxTotalSoal}
              value={Math.min(Math.max(totalSoal, minTotalSoal), maxTotalSoal)}
              onChange={e => setTotalSoal(Number(e.target.value))}
              style={{ flex: 1 }}
              disabled={activeSubjects.length === 0}
            />
            <div style={{
              minWidth: 80, textAlign: 'center',
              background: 'var(--sky-100)', borderRadius: 8, padding: '10px 16px',
              fontWeight: 800, fontSize: 20, color: 'var(--sky-700)',
            }}>
              {totalSoal}
            </div>
          </div>

          <div className="flex justify-between mt-8">
            <span className="text-xs text-muted">Minimum: {minTotalSoal}</span>
            <span className="text-xs text-muted">Maksimum: {maxTotalSoal}</span>
          </div>

          <div className="alert alert-info mt-16">
            <span>📊</span>
            <p className="text-sm">
              <strong>{totalSoal} soal total</strong> dibagi ke{' '}
              <strong>{activeSubjects.length} materi</strong>
              {activeSubjects.length > 0 && (
                <> · perkiraan <strong>{perMateriLabel}</strong></>
              )}
              {' '}· Estimasi waktu: ~{Math.ceil(totalSoal * 1.5)} menit
            </p>
          </div>
        </div>

        <div className="mt-24">
          <button
            className="btn btn-primary btn-lg btn-block"
            onClick={handleStart}
            disabled={activeSubjects.length === 0 || hasActiveDraft || isStarting}
          >
            {isStarting ? 'Memuat Soal...' : `🚀 Mulai Sesi Ujian (${totalSoal} Soal)`}
          </button>
          {hasActiveDraft && (
            <p className="text-xs text-muted text-center mt-8" style={{ color: '#92400e' }}>
              Sesi baru tidak dapat dimulai selama draft belum selesai.
            </p>
          )}
          {!hasActiveDraft && !isRekomendasi && selected.length === 0 && (
            <p className="text-xs text-muted text-center mt-8">
              Pilih minimal 1 materi untuk memulai sesi.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
