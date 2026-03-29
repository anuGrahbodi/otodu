import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getSettings, getTickerMessages, getCommunityStats } from '../db/dataStore';

function getCountdown(utbkDate) {
  const now = new Date();
  const diff = new Date(utbkDate) - now;
  const days = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  return days;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, setMode, dailyTarget, mastery, activeDraft } = useStore();

  const settings     = getSettings();
  const commStats    = getCommunityStats();
  const ticker       = getTickerMessages();
  const [days, setDays] = useState(getCountdown(settings.utbkDate));

  useEffect(() => {
    const timer = setInterval(() => setDays(getCountdown(settings.utbkDate)), 60000);
    return () => clearInterval(timer);
  }, [settings.utbkDate]);

  const pct = Math.round((dailyTarget.completed / dailyTarget.total) * 100);

  const weakSubjects = Object.entries(mastery)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3);

  return (
    <div className="page animate-fade">
      <div className="container" style={{ paddingTop: 32 }}>

        {/* ─ COMPACT COUNTDOWN BANNER ─────────────────────────── */}
        <div className="countdown-banner" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)' }}>
          <div className="relative z-10 flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '20px' }}>
            
            {/* Kiri: Info Hari */}
            <div className="flex items-center gap-16">
              <div className="countdown-days" style={{ fontSize: '42px', textShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>{days}</div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 2 }}>
                  ⏳ Hitung mundur menuju
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, opacity: 0.95, margin: 0 }}>
                  HARI LAGI · UTBK 2026
                </p>
                <p style={{ fontSize: 12, opacity: 0.75, marginTop: 2, margin: 0 }}>
                  {new Date(settings.utbkDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} — Kamu pasti bisa!
                </p>
              </div>
            </div>

            {/* Kanan: Mode Belajar */}
            <div style={{ flex: '1 1 300px', maxWidth: '450px' }}>
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                borderRadius: 10,
                padding: '12px 16px',
              }}>
                <div className="flex justify-between items-center mb-6">
                  <p style={{ fontSize: 13, fontWeight: 600, opacity: 0.9, margin: 0 }}>Mode Belajar Aktif</p>
                  <div className="flex gap-6">
                    {['speedrun', 'santai'].map(m => (
                      <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid rgba(255,255,255,0.3)',
                          background: user.mode === m ? 'rgba(255,255,255,0.25)' : 'transparent',
                          color: 'white',
                          fontWeight: user.mode === m ? 700 : 500,
                          fontSize: 12,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {m === 'speedrun' ? '⚡ Speedrun' : '☕ Santai'}
                      </button>
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.4, margin: 0 }}>
                  {user.mode === 'speedrun'
                    ? `Target: ${settings.dailyTargetDefault} soal/hari, timer aktif, skor kecepatan dihitung.`
                    : 'Timer dinonaktifkan. Fokus memahami konsep, tidak ada tekanan.'}
                </p>
              </div>
            </div>
            
          </div>
        </div>

        {/* ─ LIVE TICKER ──────────────────────────────── */}
        <div className="ticker-wrap mt-20">
          <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, whiteSpace: 'nowrap', color: 'var(--sky-300)' }}>LIVE</span>
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div className="ticker-content">
              {[...ticker, ...ticker].map((item, i) => (
                <span key={i}>{item}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ─ DAILY TARGET + ACTIONS ───────────────────── */}
        <div className="grid-2 grid gap-24 mt-24" style={{ alignItems: 'start' }}>

          {/* Daily Target Card */}
          <div className="card">
            <div className="flex items-center justify-between mb-16">
              <div>
                <p className="text-muted text-sm">Target Harian</p>
                <h2 className="title-md mt-4">
                  {user.mode === 'speedrun' ? '⚡ Mode Speedrun' : '☕ Mode Santai'}
                </h2>
              </div>
              <span className={`badge ${pct >= 100 ? 'badge-green' : pct >= 60 ? 'badge-sky' : 'badge-yellow'}`}>
                {pct >= 100 ? '🎉 Selesai!' : pct >= 60 ? '🔥 On Track' : '⚠️ Kejar!'}
              </span>
            </div>

            <div style={{ background: 'var(--sky-50)', borderRadius: 10, padding: '16px 20px', marginBottom: 16 }}>
              <div className="flex justify-between items-center mb-8">
                <span className="text-sm font-semibold">
                  {Object.keys(mastery).length} materi × {settings.soalPerMateriDefault} soal ({settings.dailyTargetDefault} soal)
                </span>
                <span className="text-sm font-bold text-sky">{dailyTarget.completed}/{dailyTarget.total}</span>
              </div>
              <div className="progress-wrap progress-lg">
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted mt-8">
                {dailyTarget.total - dailyTarget.completed} soal lagi untuk mencapai target hari ini
              </p>
            </div>

            {activeDraft && (
              <div className="alert alert-warning mb-16">
                <span>📋</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 13 }}>Draft belum selesai!</p>
                  <p style={{ fontSize: 12, marginTop: 2 }}>Kode: <code style={{ fontSize: 11 }}>{activeDraft.code}</code></p>
                </div>
              </div>
            )}

            <div className="flex gap-12" style={{ flexDirection: 'column' }}>
              <button className="btn btn-primary btn-lg btn-block" onClick={() => navigate('/setup-ujian')}>
                🚀 Kerjakan Soal
              </button>
              <button className="btn btn-secondary btn-block" onClick={() => navigate('/statistik')}>
                📊 Lihat Statistik Lengkap
              </button>
            </div>
          </div>

          {/* Weakness Radar Preview */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <p className="text-muted text-sm">Diagnosis DINA</p>
              <h2 className="title-md mt-4">Titik Lemah Kamu</h2>
            </div>

            {weakSubjects.map(([subj, val]) => {
              const pctMastery = Math.round(val * 100);
              const { label, icon } = { MATBAS: { label: 'Matematika Dasar', icon: '📐' }, LINGPM: { label: 'Penalaran Umum', icon: '🧩' }, BINDON: { label: 'Bahasa Indonesia', icon: '📖' }, BINGEN: { label: 'Bahasa Inggris', icon: '🌐' }, PPU: { label: 'Pemahaman Bacaan', icon: '✍️' }, PBM: { label: 'Pengetahuan Kuantitatif', icon: '🔢' } }[subj] || { label: subj, icon: '📚' };
              return (
                <div key={subj}>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-semibold">{icon} {label}</span>
                    <span className={`badge ${pctMastery < 50 ? 'badge-red' : pctMastery < 70 ? 'badge-yellow' : 'badge-green'}`}>
                      {pctMastery}%
                    </span>
                  </div>
                  <div className="progress-wrap">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${pctMastery}%`,
                        background: pctMastery < 50
                          ? 'linear-gradient(90deg, #ef4444, #f97316)'
                          : pctMastery < 70
                            ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                            : 'linear-gradient(90deg, #22c55e, #16a34a)',
                      }}
                    />
                  </div>
                </div>
              );
            })}

            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 8, alignSelf: 'flex-end' }}
              onClick={() => navigate('/statistik')}
            >
              Lihat semua →
            </button>
          </div>
        </div>

        {/* ─── STATS SUMMARY ─────────────────────────── */}
        <div className="grid-3 grid gap-16 mt-20">
          {[
            { label: 'Total Pengguna Platform', value: commStats.totalUsers.toLocaleString('id'), sub: `+${commStats.totalUsers > 10000 ? '124' : '12'} minggu ini`, icon: '👥' },
            { label: 'Rata-rata Skor Komunitas', value: `${commStats.avgScoreCommunity}%`, sub: 'Skor rata-rata all-time', icon: '📈' },
            { label: 'Sesi Dikerjakan', value: commStats.totalSessionsAllTime.toLocaleString('id'), sub: `${commStats.sessionsToday.toLocaleString('id')} hari ini`, icon: '✅' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--sky-600)' }}>{s.value}</div>
              <div className="text-sm font-semibold mt-4">{s.label}</div>
              <div className="text-xs text-muted mt-4">{s.sub}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
