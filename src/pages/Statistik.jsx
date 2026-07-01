import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SUBJECTS } from '../data/questions';
import logoFace from '../assets/images/logo_face.png';

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

  const avgScore = sessions.length
    ? Math.round(sessions.reduce((s, ses) => s + ses.skillScore, 0) / sessions.length)
    : 0;
  const totalSoal = sessions.reduce((s, ses) => s + ses.totalQuestions, 0);
  const totalCorrect = sessions.reduce((s, ses) => s + ses.correct, 0);

  return (
    <div className="page animate-fade">
      <div className="container" style={{ paddingTop: 32 }}>

        <div className="flex items-center justify-between mb-24">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--sky-500), var(--sky-600))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(14,165,233,0.25)'
            }}>
              <img src={logoFace} alt="OTODU" style={{ width: 26, height: 26, objectFit: 'contain' }} />
            </div>
            <div>
              <h1 className="title-lg">📊 Statistik Lengkap</h1>
              <p className="text-muted mt-4">Analitik mendalam perkembangan belajarmu</p>
            </div>
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

        {/* TAB: HISTORY */}
        <div className="card">
          <h2 className="title-sm mb-16">📋 Riwayat Sesi Ujian</h2>
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

      </div>
    </div>
  );
}
