import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip,
} from 'recharts';
import { useStore } from '../store/useStore';
import { SUBJECTS } from '../data/questions';

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatTime(ms) {
  const t = Math.floor(ms / 1000);
  return `${Math.floor(t / 60)}m ${t % 60}s`;
}

export default function Statistik() {
  const navigate = useNavigate();
  const { mastery, sessions } = useStore();
  const [activeTab, setActiveTab] = useState('overview');

  const radarData = Object.entries(SUBJECTS).map(([key, s]) => ({
    subject: s.label.split(' ').slice(0, 2).join(' '),
    mastery: Math.round((mastery[key] ?? 0.5) * 100),
    fullMark: 100,
    icon: s.icon,
  }));

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, ses) => s + ses.skillScore, 0) / sessions.length)
    : 0;
  const totalSoal = sessions.reduce((s, ses) => s + ses.totalQuestions, 0);
  const totalCorrect = sessions.reduce((s, ses) => s + ses.correct, 0);

  return (
    <div className="page animate-fade">
      <div className="container" style={{ paddingTop: 32 }}>

        <div className="flex items-center justify-between mb-24">
          <div>
            <h1 className="title-lg">📊 Statistik Lengkap</h1>
            <p className="text-muted mt-4">Analitik mendalam perkembangan belajarmu</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/setup-ujian')}>
            📝 Sesi Baru
          </button>
        </div>

        {/* SUMMARY STATS */}
        <div className="grid-3 grid gap-16 mb-24">
          {[
            { icon: '🏆', label: 'Rata-rata Skor', value: `${avgScore}%`, sub: `${sessions.length} sesi selesai` },
            { icon: '📝', label: 'Total Soal', value: totalSoal.toLocaleString('id'), sub: `${totalCorrect} benar (${totalSoal ? Math.round(totalCorrect/totalSoal*100) : 0}%)` },
            { icon: '🔥', label: 'Streak Hari Ini', value: '3 hari', sub: 'Terus pertahankan!' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--sky-600)' }}>{s.value}</div>
              <div className="text-sm font-semibold mt-4">{s.label}</div>
              <div className="text-xs text-muted mt-4">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div className="tabs mb-20">
          {[
            { key: 'overview', label: '📡 Radar Diagnostik' },
            { key: 'mastery',  label: '📈 Detail Mastery' },
            { key: 'history',  label: '📋 Riwayat Sesi' },
          ].map(t => (
            <button
              key={t.key}
              className={`tab-btn ${activeTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: RADAR */}
        {activeTab === 'overview' && (
          <div className="grid-2 grid gap-24" style={{ alignItems: 'start' }}>
            <div className="card">
              <h2 className="title-sm mb-16">🕸 Peta Kemampuan DINA</h2>
              <div className="radar-wrap" style={{ height: 340 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                    <PolarGrid stroke="var(--sky-200)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 11, fill: 'var(--gray-600)', fontWeight: 600 }}
                    />
                    <PolarRadiusAxis
                      angle={90} domain={[0, 100]}
                      tick={{ fontSize: 10, fill: 'var(--gray-400)' }}
                    />
                    <Radar
                      name="Mastery"
                      dataKey="mastery"
                      stroke="var(--sky-500)"
                      fill="var(--sky-400)"
                      fillOpacity={0.3}
                      strokeWidth={2}
                      dot={{ fill: 'var(--sky-600)', r: 4 }}
                    />
                    <Tooltip
                      formatter={(val) => [`${val}%`, 'Mastery']}
                      contentStyle={{ fontSize: 12, borderRadius: 8 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h2 className="title-sm mb-16">🏹 Rekomendasi Belajar</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {Object.entries(mastery)
                  .sort((a, b) => a[1] - b[1])
                  .map(([key, val]) => {
                    const pct = Math.round(val * 100);
                    const s = SUBJECTS[key];
                    const priority = pct < 50 ? 'high' : pct < 70 ? 'medium' : 'low';
                    return (
                      <div key={key} style={{
                        padding: '12px 16px', borderRadius: 10,
                        background: priority === 'high' ? 'var(--error-bg)' : priority === 'medium' ? 'var(--warning-bg)' : 'var(--success-bg)',
                        border: `1.5px solid ${priority === 'high' ? '#fca5a5' : priority === 'medium' ? '#fde68a' : '#86efac'}`,
                        display: 'flex', alignItems: 'center', gap: 12,
                      }}>
                        <span style={{ fontSize: 20 }}>{s.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div className="flex justify-between">
                            <p style={{ fontWeight: 600, fontSize: 13 }}>{s.label}</p>
                            <span className={`badge ${priority === 'high' ? 'badge-red' : priority === 'medium' ? 'badge-yellow' : 'badge-green'}`}>
                              {pct}%
                            </span>
                          </div>
                          <p style={{ fontSize: 11, marginTop: 4, color: 'var(--text-muted)' }}>
                            {priority === 'high' ? '🚨 Prioritas utama — latih segera!' : priority === 'medium' ? '⚠️ Butuh perhatian lebih' : '✅ Pertahankan performa ini'}
                          </p>
                          <div className="progress-wrap mt-8" style={{ height: 6 }}>
                            <div
                              className="progress-fill"
                              style={{
                                width: `${pct}%`,
                                background: priority === 'high'
                                  ? 'linear-gradient(90deg, #ef4444, #f97316)'
                                  : priority === 'medium'
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
          </div>
        )}

        {/* TAB: MASTERY DETAIL */}
        {activeTab === 'mastery' && (
          <div className="card">
            <h2 className="title-sm mb-16">📈 Detail Mastery per Sub-Tes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {Object.entries(SUBJECTS).map(([key, s]) => {
                const pct = Math.round((mastery[key] ?? 0.5) * 100);
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-10">
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: 14 }}>{s.label}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Kode: {s.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-12">
                        <div style={{
                          width: 56, height: 56, borderRadius: '50%',
                          background: `conic-gradient(${pct < 50 ? '#ef4444' : pct < 70 ? '#f59e0b' : '#22c55e'} ${pct * 3.6}deg, var(--sky-100) 0deg)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                        }}>
                          <div style={{
                            width: 42, height: 42, background: 'white', borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute',
                            fontWeight: 800, fontSize: 13,
                            color: pct < 50 ? 'var(--error)' : pct < 70 ? 'var(--warning)' : 'var(--success)',
                          }}>
                            {pct}%
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="progress-wrap" style={{ height: 10 }}>
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
                    <div className="flex justify-between mt-4">
                      <span className="text-xs text-muted">0%</span>
                      <span className="text-xs" style={{
                        color: pct < 50 ? 'var(--error)' : pct < 70 ? 'var(--warning)' : 'var(--success)',
                        fontWeight: 600,
                      }}>
                        {pct < 50 ? '🚨 Prioritas' : pct < 70 ? '⚠️ Perlu Latihan' : '✅ Bagus!'}
                      </span>
                      <span className="text-xs text-muted">100%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB: HISTORY */}
        {activeTab === 'history' && (
          <div>
            {sessions.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: 48 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                <h3 className="title-sm">Belum ada riwayat sesi</h3>
                <p className="text-muted mt-8">Selesaikan sesi ujian pertamamu untuk melihat riwayat.</p>
                <button className="btn btn-primary mt-20" onClick={() => navigate('/setup-ujian')}>
                  🚀 Mulai Sesi Pertama
                </button>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Kode Sesi</th>
                      <th>Tanggal</th>
                      <th>Materi</th>
                      <th>Soal</th>
                      <th>Skor</th>
                      <th>Waktu</th>
                      <th>Status</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map(ses => (
                      <tr key={ses.code}>
                        <td>
                          <code style={{ fontSize: 11, color: 'var(--sky-700)', fontWeight: 700 }}>
                            {ses.code}
                          </code>
                        </td>
                        <td className="text-sm">{formatDate(ses.date)}</td>
                        <td>
                          <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                            {ses.subjects.map(k => (
                              <span key={k} className="badge badge-sky" style={{ fontSize: 10 }}>
                                {SUBJECTS[k]?.icon}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="text-sm">
                          <span style={{ color: 'var(--success)', fontWeight: 600 }}>{ses.correct}</span>
                          <span className="text-muted">/{ses.totalQuestions}</span>
                        </td>
                        <td>
                          <span style={{
                            fontWeight: 800, fontSize: 15,
                            color: ses.skillScore >= 80 ? 'var(--success)' : ses.skillScore >= 60 ? 'var(--warning)' : 'var(--error)',
                          }}>
                            {ses.skillScore}%
                          </span>
                        </td>
                        <td className="text-sm text-muted">{formatTime(ses.elapsed)}</td>
                        <td>
                          <span className="badge badge-green">Selesai</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => navigate(`/review/${ses.code}`)}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
