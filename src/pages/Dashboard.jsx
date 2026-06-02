import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { getSettings } from '../db/dataStore';
import { getDailyTargetProgress, isDailyTargetComplete, getModeConfig } from '../data/modes';
import CircleProgress from '../components/CircleProgress';
import ModeTooltip from '../components/ModeTooltip';

function getCountdown(utbkDate) {
  const now = new Date();
  const diff = new Date(utbkDate) - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, dailyTarget, activeDraft } = useStore();

  const settings = getSettings();
  const [days, setDays] = useState(getCountdown(settings.utbkDate));

  useEffect(() => {
    const timer = setInterval(() => setDays(getCountdown(settings.utbkDate)), 60000);
    return () => clearInterval(timer);
  }, [settings.utbkDate]);

  const { donePct, correctPct, overallPct } = getDailyTargetProgress(dailyTarget);
  const isComplete = isDailyTargetComplete(dailyTarget);
  const utbkDateLabel = new Date(settings.utbkDate).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const statusBadge = isComplete
    ? { cls: 'badge-green', text: '🎉 Selesai!' }
    : overallPct >= 60
      ? { cls: 'badge-sky', text: '🔥 On Track' }
      : { cls: 'badge-yellow', text: 'Belum tercapai' };

  return (
    <div className="page animate-fade">
      <div className="container" style={{ paddingTop: 32 }}>

        <header className="dashboard-header">
          <div>
            <h1 className="title-lg">Halo, {user.name}! 👋</h1>
            <p className="text-muted mt-4">Ringkasan belajarmu hari ini</p>
          </div>
        </header>

        <section className="countdown-banner mt-24">
          <div className="countdown-banner-inner">
            <div className="flex items-center gap-16">
              <div className="countdown-days" style={{ fontSize: 'clamp(48px, 8vw, 72px)' }}>
                {days}
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.85, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  ⏳ Hitung mundur menuju
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, marginTop: 4 }}>
                  HARI LAGI · UTBK 2027
                </p>
                <p style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>
                  Kamu pasti bisa!
                </p>
              </div>
            </div>

            <div className="countdown-banner-side">
              <p style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Tanggal UTBK
              </p>
              <p style={{ fontSize: 14, fontWeight: 700, marginTop: 6 }}>{utbkDateLabel}</p>
            </div>
          </div>
        </section>

        <section className="card mt-24">
          <div className="flex items-center justify-between mb-20" style={{ flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div className="flex items-center gap-8" style={{ flexWrap: 'wrap' }}>
                <p className="text-muted text-sm">
                  Target Harian:{' '}
                  <span style={{ fontWeight: 700, color: 'var(--sky-700)' }}>
                    {getModeConfig(user.mode).shortLabel}
                  </span>
                </p>
                <ModeTooltip mode={user.mode} />
              </div>
              <h2 className="title-md mt-4">Progress Belajar Hari Ini</h2>
            </div>
            <span className={`badge ${statusBadge.cls}`}>{statusBadge.text}</span>
          </div>

          <div className="dashboard-hero">
            <CircleProgress
              completed={dailyTarget.completed}
              total={dailyTarget.completedRequired}
              correct={dailyTarget.correct}
              correctTotal={dailyTarget.correctRequired}
              size={156}
            />

            <div className="dashboard-hero-body">
              <div className="dashboard-info-box">
                <p className="text-sm text-muted" style={{ lineHeight: 1.65 }}>
                  Sistem akan mengambil soal yang paling sesuai dengan kebutuhanmu,
                  berdasarkan data pengerjaan soal dan kemampuan kamu saat ini.
                </p>

                <div className="mt-16">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-sm font-semibold">Soal selesai</span>
                    <span className="text-sm font-bold text-sky">
                      {dailyTarget.completed}/{dailyTarget.completedRequired}
                    </span>
                  </div>
                  <div className="progress-wrap progress-lg">
                    <div className="progress-fill" style={{ width: `${donePct}%` }} />
                  </div>
                </div>

                <div className="mt-16">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-sm font-semibold">Jawaban benar</span>
                    <span className="text-sm font-bold text-success">
                      {dailyTarget.correct}/{dailyTarget.correctRequired}
                    </span>
                  </div>
                  <div className="progress-wrap progress-lg">
                    <div
                      className="progress-fill progress-fill-green"
                      style={{ width: `${correctPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {activeDraft && (
                <div className="alert alert-warning">
                  <span>📋</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, fontSize: 13 }}>Draft belum selesai!</p>
                    <p style={{ fontSize: 12, marginTop: 2 }}>
                      Kode: <code style={{ fontSize: 11 }}>{activeDraft.code}</code>
                    </p>
                    <button
                      className="btn btn-sm btn-primary mt-8"
                      onClick={() => navigate(`/ujian/${activeDraft.code}`)}
                    >
                      ▶ Lanjutkan Draft
                    </button>
                  </div>
                </div>
              )}

              <div className="dashboard-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/setup-ujian')}>
                  🚀 Kerjakan Soal
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/statistik')}>
                  📊 Statistik
                </button>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
