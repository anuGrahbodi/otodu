import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { SUBJECTS } from '../data/questions';
import { QUESTION_TYPES, SUBTESTS, getQuestionTypeConfig } from '../data/questionTypes';
import QuestionForm from '../components/admin/QuestionForm';
import logoFull from '../assets/images/logo_full.png';
import logoFace from '../assets/images/logo_face.png';
import {
  getQuestions, addQuestion, updateQuestion, deleteQuestion,
  getCommunityStats, saveCommunityStats,
  getSettings, saveSettings,
  getRawTickerMessages, saveTickerMessages,
  getTryoutPackages, addTryoutPackage, updateTryoutPackage, deleteTryoutPackage,
  getUsers, updateUser, deleteUser,
  getActivityLog, addActivityLog,
  resetToDefaults,
} from '../db/dataStore';

// ─── helpers ─────────────────────────────────────────────────────────────────
const DIFF_LABEL = { 1: 'Mudah', 2: 'Sedang', 3: 'Sulit' };
const DIFF_BADGE = { 1: 'badge-green', 2: 'badge-yellow', 3: 'badge-red' };
const STATUS_BADGE = { aktif: 'badge-green', selesai: 'badge-gray', draft: 'badge-sky' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 14, padding: 28,
        width: '100%', maxWidth: 820, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-20">
          <h3 className="title-md">{title}</h3>
          <button onClick={onClose} style={{ fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── TAB: OVERVIEW ───────────────────────────────────────────────────────────
function TabOverview() {
  const [stats, setStats] = useState(getCommunityStats());
  const [log, setLog]     = useState(getActivityLog());
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ ...stats });
  const questions = getQuestions();

  const save = () => {
    const parsed = {
      ...draft,
      totalUsers: +draft.totalUsers,
      totalQuestions: +draft.totalQuestions,
      totalSessionsAllTime: +draft.totalSessionsAllTime,
      sessionsToday: +draft.sessionsToday,
      usersCompletedTargetToday: +draft.usersCompletedTargetToday,
      soalDikerjakanJamIni: +draft.soalDikerjakanJamIni,
      avgScoreCommunity: +draft.avgScoreCommunity,
      topSubjectStruggleCorrectRate: +draft.topSubjectStruggleCorrectRate,
      usersImprovedPUThisWeek: +draft.usersImprovedPUThisWeek,
      topPerformerThreshold: +draft.topPerformerThreshold,
    };
    saveCommunityStats(parsed);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'system', message: 'Statistik komunitas diperbarui oleh Admin.', timestamp: new Date().toISOString() });
    setStats(getCommunityStats());
    setLog(getActivityLog());
    setEditing(false);
  };

  const statCards = [
    { label: 'Total Pengguna', value: stats.totalUsers.toLocaleString('id'), icon: '👥' },
    { label: 'Total Soal', value: questions.length.toLocaleString('id'), icon: '📚' },
    { label: 'Sesi All-time', value: stats.totalSessionsAllTime.toLocaleString('id'), icon: '✅' },
    { label: 'Skor Rata-rata', value: `${stats.avgScoreCommunity}%`, icon: '📈' },
  ];

  return (
    <>
      <div className="grid-3 grid gap-16" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {statCards.map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--sky-600)' }}>{s.value}</div>
            <div className="text-sm font-semibold mt-4">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card mt-16">
        <div className="flex justify-between items-center mb-16">
          <h3 className="title-md">Statistik Komunitas</h3>
          {!editing ? (
            <button className="btn btn-secondary btn-sm" onClick={() => { setDraft({ ...stats }); setEditing(true); }}>✏️ Edit Statistik</button>
          ) : (
            <div className="flex gap-8">
              <button className="btn btn-primary btn-sm" onClick={save}>💾 Simpan</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Batal</button>
            </div>
          )}
        </div>

        {!editing ? (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--sky-50)', borderRadius: 8 }}>
                <span className="text-sm text-muted">{k}</span>
                <span className="text-sm font-semibold">{String(v)}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {Object.entries(draft).map(([k, v]) => (
              <div key={k}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>{k}</label>
                <input
                  className="input"
                  value={draft[k]}
                  onChange={e => setDraft(d => ({ ...d, [k]: e.target.value }))}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card mt-16">
        <h3 className="title-md mb-16">Log Aktivitas Terbaru</h3>
        <div className="flex flex-col gap-8">
          {log.slice(0, 10).map(entry => (
            <div key={entry.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8 }}>
              <span style={{ fontSize: 18 }}>
                {entry.type === 'system' ? '🛠️' : entry.type === 'content' ? '📝' : '👤'}
              </span>
              <div style={{ flex: 1 }}>
                <p className="text-sm font-semibold" style={{ margin: 0 }}>{entry.message}</p>
                <p className="text-xs text-muted" style={{ margin: '2px 0 0' }}>
                  {new Date(entry.timestamp).toLocaleString('id-ID')}
                </p>
              </div>
              <span className={`badge ${entry.type === 'system' ? 'badge-sky' : entry.type === 'content' ? 'badge-green' : 'badge-yellow'}`}>
                {entry.type}
              </span>
            </div>
          ))}
          {log.length === 0 && <p className="text-muted text-sm">Belum ada aktivitas.</p>}
        </div>
      </div>
    </>
  );
}

// ─── TAB: BANK SOAL ──────────────────────────────────────────────────────────
function TabSoal() {
  const [questions, setQuestions] = useState(getQuestions());
  const [filter, setFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [modal, setModal] = useState(null); // null | 'add' | editObj

  const reload = () => setQuestions(getQuestions());

  const handleAdd = (q) => {
    if (getQuestions().find(x => x.id === q.id)) return alert('ID sudah ada!');
    addQuestion(q);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'content', message: `Soal baru ditambahkan: ${q.id} (${getQuestionTypeConfig(q.questionType).shortLabel}, ${SUBJECTS[q.subject]?.label}).`, timestamp: new Date().toISOString() });
    reload();
    setModal(null);
  };

  const handleEdit = (q) => {
    updateQuestion(q);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'content', message: `Soal diperbarui: ${q.id}.`, timestamp: new Date().toISOString() });
    reload();
    setModal(null);
  };

  const handleDelete = (id) => {
    if (!confirm(`Hapus soal ${id}? Tindakan ini tidak bisa dibatalkan.`)) return;
    deleteQuestion(id);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'content', message: `Soal dihapus: ${id}.`, timestamp: new Date().toISOString() });
    reload();
  };

  const filtered = questions.filter(q => {
    const matchSubject = subjectFilter === 'ALL' || q.subject === subjectFilter;
    const matchType = typeFilter === 'ALL' || q.questionType === typeFilter;
    const matchSearch  = !filter || q.id.toLowerCase().includes(filter.toLowerCase()) || q.question.toLowerCase().includes(filter.toLowerCase());
    return matchSubject && matchType && matchSearch;
  });

  const typeCounts = Object.fromEntries(
    Object.keys(QUESTION_TYPES).map(t => [t, questions.filter(q => q.questionType === t).length])
  );

  return (
    <>
      {modal && (
        <Modal title={modal === 'add' ? '➕ Tambah Soal Baru' : `✏️ Edit Soal – ${modal.id}`} onClose={() => setModal(null)}>
          <QuestionForm
            initialData={modal === 'add' ? null : modal}
            onSave={modal === 'add' ? handleAdd : handleEdit}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-20" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3 className="title-md">Bank Soal <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>({questions.length} total)</span></h3>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            <input className="input" placeholder="Cari ID / soal..." style={{ width: 180 }} value={filter} onChange={e => setFilter(e.target.value)} />
            <select className="input" style={{ width: 'auto' }} value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
              <option value="ALL">Semua Mapel</option>
              {Object.entries(SUBJECTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <select className="input" style={{ width: 'auto' }} value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="ALL">Semua Tipe</option>
              {Object.values(QUESTION_TYPES).map(t => (
                <option key={t.id} value={t.id}>{t.shortLabel} – {t.label}</option>
              ))}
            </select>
            <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ Tambah Soal</button>
          </div>
        </div>

        <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
          {Object.values(QUESTION_TYPES).map(t => (
            <span key={t.id} className="badge badge-sky" style={{ fontSize: 11 }}>
              {t.icon} {t.shortLabel}: {typeCounts[t.id] ?? 0}
            </span>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Tipe</th>
                <th>Subtes</th>
                <th>Mapel</th>
                <th>Pertanyaan (potongan)</th>
                <th>Kesulitan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(q => {
                const typeCfg = getQuestionTypeConfig(q.questionType);
                return (
                <tr key={q.id}>
                  <td><code style={{ fontSize: 12 }}>{q.id}</code></td>
                  <td><span className="badge badge-yellow" style={{ fontSize: 11 }} title={typeCfg.label}>{typeCfg.icon} {typeCfg.shortLabel}</span></td>
                  <td style={{ fontSize: 11 }}>{SUBTESTS[q.subtest]?.label ?? q.subtest}</td>
                  <td><span className="badge badge-sky" style={{ fontSize: 11 }}>{SUBJECTS[q.subject]?.label ?? q.subject}</span></td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question}</td>
                  <td><span className={`badge ${DIFF_BADGE[q.difficulty]}`}>{DIFF_LABEL[q.difficulty]}</span></td>
                  <td><span className={`badge ${q.isActive ? 'badge-green' : 'badge-gray'}`}>{q.isActive ? 'Aktif' : 'Nonaktif'}</span></td>
                  <td>
                    <button className="btn btn-ghost btn-sm text-sky" onClick={() => setModal({ ...q })}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(q.id)}>Hapus</button>
                  </td>
                </tr>
              );})}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>Tidak ada soal ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted mt-12 text-center">Menampilkan {filtered.length} dari {questions.length} soal.</p>
      </div>
    </>
  );
}

// ─── TAB: PAKET TRYOUT ───────────────────────────────────────────────────────
const EMPTY_PKG = {
  id: '', name: '', startDate: '', endDate: '', status: 'draft',
  participants: 0,
  subjects: Object.keys(SUBJECTS),
  soalPerMateri: 10,
};

function TryoutForm({ initialData, onSave, onCancel }) {
  const [pkg, setPkg] = useState(initialData ? { ...initialData, subjects: [...initialData.subjects] } : { ...EMPTY_PKG, subjects: [...EMPTY_PKG.subjects] });

  const toggleSubject = (k) => {
    setPkg(p => ({
      ...p,
      subjects: p.subjects.includes(k) ? p.subjects.filter(s => s !== k) : [...p.subjects, k],
    }));
  };

  const handleSave = () => {
    if (!pkg.id.trim() || !pkg.name.trim()) return alert('ID dan Nama wajib diisi!');
    if (pkg.subjects.length === 0) return alert('Pilih minimal 1 mata pelajaran!');
    onSave({ ...pkg, participants: +pkg.participants, soalPerMateri: +pkg.soalPerMateri });
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>ID Paket *</label>
          <input className="input" value={pkg.id} onChange={e => setPkg(p => ({ ...p, id: e.target.value }))} placeholder="mis. TO-2026-04" disabled={!!initialData} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Nama Paket *</label>
          <input className="input" value={pkg.name} onChange={e => setPkg(p => ({ ...p, name: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tanggal Mulai</label>
          <input type="date" className="input" value={pkg.startDate} onChange={e => setPkg(p => ({ ...p, startDate: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tanggal Selesai</label>
          <input type="date" className="input" value={pkg.endDate} onChange={e => setPkg(p => ({ ...p, endDate: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Status</label>
          <select className="input" value={pkg.status} onChange={e => setPkg(p => ({ ...p, status: e.target.value }))}>
            <option value="draft">Draft</option>
            <option value="aktif">Aktif</option>
            <option value="selesai">Selesai</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Soal per Materi</label>
          <input type="number" min={1} max={50} className="input" value={pkg.soalPerMateri} onChange={e => setPkg(p => ({ ...p, soalPerMateri: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 8 }}>Mata Pelajaran yang Diujikan</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {Object.entries(SUBJECTS).map(([k, v]) => (
            <button
              key={k}
              type="button"
              onClick={() => toggleSubject(k)}
              className={`btn btn-sm ${pkg.subjects.includes(k) ? 'btn-primary' : 'btn-ghost'}`}
            >
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-8 justify-end mt-8">
        <button className="btn btn-ghost" onClick={onCancel} type="button">Batal</button>
        <button className="btn btn-primary" onClick={handleSave} type="button">💾 Simpan Paket</button>
      </div>
    </div>
  );
}

function TabTryout() {
  const [packages, setPackages] = useState(getTryoutPackages());
  const [modal, setModal] = useState(null);

  const reload = () => setPackages(getTryoutPackages());

  const handleAdd = (pkg) => {
    if (getTryoutPackages().find(p => p.id === pkg.id)) return alert('ID sudah ada!');
    addTryoutPackage(pkg);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'system', message: `Paket tryout baru dibuat: ${pkg.name}.`, timestamp: new Date().toISOString() });
    reload(); setModal(null);
  };

  const handleEdit = (pkg) => {
    updateTryoutPackage(pkg);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'system', message: `Paket tryout diperbarui: ${pkg.name}.`, timestamp: new Date().toISOString() });
    reload(); setModal(null);
  };

  const handleDelete = (id) => {
    if (!confirm(`Hapus paket ${id}?`)) return;
    deleteTryoutPackage(id);
    reload();
  };

  return (
    <>
      {modal && (
        <Modal title={modal === 'add' ? '➕ Buat Paket Tryout' : `✏️ Edit – ${modal.name}`} onClose={() => setModal(null)}>
          <TryoutForm
            initialData={modal === 'add' ? null : modal}
            onSave={modal === 'add' ? handleAdd : handleEdit}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-20">
          <h3 className="title-md">Paket Tryout Nasional <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>({packages.length} paket)</span></h3>
          <button className="btn btn-primary btn-sm" onClick={() => setModal('add')}>+ Buat Paket</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Paket</th>
                <th>Tanggal</th>
                <th>Status</th>
                <th>Peserta</th>
                <th>Soal/Materi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {packages.map(pkg => (
                <tr key={pkg.id}>
                  <td><code style={{ fontSize: 12 }}>{pkg.id}</code></td>
                  <td className="font-semibold">{pkg.name}</td>
                  <td style={{ fontSize: 12 }}>{pkg.startDate} → {pkg.endDate}</td>
                  <td><span className={`badge ${STATUS_BADGE[pkg.status] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{pkg.status}</span></td>
                  <td>{(pkg.participants || 0).toLocaleString('id')}</td>
                  <td>{pkg.soalPerMateri}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm text-sky" onClick={() => setModal({ ...pkg, subjects: [...pkg.subjects] })}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(pkg.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>Belum ada paket tryout.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── TAB: PENGGUNA ───────────────────────────────────────────────────────────
function TabUsers() {
  const [users, setUsers] = useState(getUsers());
  const [search, setSearch] = useState('');
  const [editUser, setEditUser] = useState(null);

  const reload = () => setUsers(getUsers());

  const handleSave = () => {
    updateUser(editUser);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'user', message: `Data pengguna diperbarui: ${editUser.name} (${editUser.email}).`, timestamp: new Date().toISOString() });
    reload(); setEditUser(null);
  };

  const handleDelete = (id) => {
    const u = users.find(u => u.id === id);
    if (!confirm(`Hapus akun ${u?.name}?`)) return;
    deleteUser(id);
    reload();
  };

  const filtered = users.filter(u =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {editUser && (
        <Modal title={`✏️ Edit Pengguna – ${editUser.name}`} onClose={() => setEditUser(null)}>
          <div className="flex flex-col gap-14">
            {[
              { key: 'name', label: 'Nama Lengkap' },
              { key: 'email', label: 'Email' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>{label}</label>
                <input className="input" value={editUser[key]} onChange={e => setEditUser(u => ({ ...u, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Role</label>
              <select className="input" value={editUser.role} onChange={e => setEditUser(u => ({ ...u, role: e.target.value }))}>
                <option value="siswa">Siswa</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Langganan</label>
              <select className="input" value={editUser.subscription} onChange={e => setEditUser(u => ({ ...u, subscription: e.target.value }))}>
                <option value="gratis">Gratis</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="flex gap-8 justify-end mt-8">
              <button className="btn btn-ghost" onClick={() => setEditUser(null)}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>💾 Simpan</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="card">
        <div className="flex justify-between items-center mb-20" style={{ flexWrap: 'wrap', gap: 12 }}>
          <h3 className="title-md">Pengguna Sistem <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>({users.length} akun)</span></h3>
          <div className="flex gap-8">
            <input className="input" placeholder="Cari nama / email..." style={{ width: 220 }} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pengguna</th>
                <th>Role</th>
                <th>Langganan</th>
                <th>Bergabung</th>
                <th>Login Terakhir</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-muted">{u.email}</div>
                  </td>
                  <td><span className={`badge ${u.role === 'admin' ? 'badge-red' : u.role === 'editor' ? 'badge-sky' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.role}</span></td>
                  <td><span className={`badge ${u.subscription === 'premium' ? 'badge-yellow' : 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{u.subscription}</span></td>
                  <td style={{ fontSize: 12 }}>{u.joinDate}</td>
                  <td style={{ fontSize: 12 }}>{u.lastLogin}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm text-sky" onClick={() => setEditUser({ ...u })}>Edit</button>
                    <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(u.id)}>Hapus</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: 24 }}>Tidak ada pengguna ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ─── TAB: PENGATURAN ─────────────────────────────────────────────────────────
function TabSettings() {
  const [settings, setSettings] = useState(getSettings());
  const [tickers, setTickers]   = useState(getRawTickerMessages().join('\n'));
  const [saved, setSaved]       = useState(false);

  const handleSave = () => {
    saveSettings({
      ...settings,
      dailyTargetDefault: +settings.dailyTargetDefault,
      soalPerMateriDefault: +settings.soalPerMateriDefault,
    });
    // Save raw ticker messages (without interpolation)
    const rawTickers = tickers.split('\n').map(t => t.trim()).filter(Boolean);
    saveTickerMessages(rawTickers);
    addActivityLog({ id: `LOG${Date.now()}`, type: 'system', message: 'Pengaturan global diperbarui oleh Admin.', timestamp: new Date().toISOString() });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = async () => {
    if (!confirm('⚠️ Reset SEMUA data (soal, pengguna, paket tryout, pengaturan) ke kondisi awal?\n\nTindakan ini tidak dapat dibatalkan!')) return;
    await resetToDefaults();
    window.location.reload();
  };

  return (
    <div className="card">
      <h3 className="title-md mb-20">⚙️ Pengaturan Global</h3>

      <div className="flex flex-col gap-20">

        {/* Basic Info */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <p className="text-sm font-semibold text-muted mb-12" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Informasi Aplikasi</p>
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Nama Aplikasi</label>
              <input className="input" value={settings.appName} onChange={e => setSettings(s => ({ ...s, appName: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tagline</label>
              <input className="input" value={settings.tagline} onChange={e => setSettings(s => ({ ...s, tagline: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tanggal UTBK</label>
              <p className="input" style={{ background: 'var(--gray-50)', color: 'var(--text-secondary)', cursor: 'default' }}>
                {new Date(settings.utbkDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Security */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <p className="text-sm font-semibold text-muted mb-12" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Keamanan</p>
          <div style={{ maxWidth: 320 }}>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Password Admin</label>
            <input type="password" className="input" value={settings.adminPassword} onChange={e => setSettings(s => ({ ...s, adminPassword: e.target.value }))} />
            <p className="text-xs text-muted mt-4">Ganti password untuk akses panel admin.</p>
          </div>
        </div>

        {/* Exam Config */}
        <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: 20 }}>
          <p className="text-sm font-semibold text-muted mb-12" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Konfigurasi Ujian</p>
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between p-16 border rounded" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold">Mode Ujian Ketat (Proctoring)</div>
                <div className="text-sm text-muted">Wajib hidupkan kamera saat Tryout Akbar.</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={!!settings.proctorEnabled} onChange={e => setSettings(s => ({ ...s, proctorEnabled: e.target.checked }))} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="flex items-center justify-between p-16 border rounded" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold">Pendaftaran Pengguna Baru</div>
                <div className="text-sm text-muted">Mengizinkan pembuatan akun baru.</div>
              </div>
              <label className="toggle">
                <input type="checkbox" checked={!!settings.registrationOpen} onChange={e => setSettings(s => ({ ...s, registrationOpen: e.target.checked }))} />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="flex items-center justify-between p-16 border rounded" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold">Metode Skoring</div>
                <div className="text-sm text-muted">Gunakan IRT atau poin klasik.</div>
              </div>
              <select className="input" style={{ width: 'auto' }} value={settings.scoringMethod} onChange={e => setSettings(s => ({ ...s, scoringMethod: e.target.value }))}>
                <option value="klasik">Klasik (Benar +1)</option>
                <option value="irt">IRT Dinamis</option>
              </select>
            </div>
            <div className="flex items-center justify-between p-16 border rounded" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold">Target Soal Harian Default</div>
                <div className="text-sm text-muted">Jumlah soal yang harus dikerjakan per hari.</div>
              </div>
              <input type="number" min={5} max={100} className="input" style={{ width: 90 }} value={settings.dailyTargetDefault} onChange={e => setSettings(s => ({ ...s, dailyTargetDefault: e.target.value }))} />
            </div>
            <div className="flex items-center justify-between p-16 border rounded" style={{ borderColor: 'var(--border)' }}>
              <div>
                <div className="font-semibold">Soal per Materi (default)</div>
                <div className="text-sm text-muted">Jumlah soal tiap mata pelajaran se-sesi.</div>
              </div>
              <input type="number" min={1} max={30} className="input" style={{ width: 90 }} value={settings.soalPerMateriDefault} onChange={e => setSettings(s => ({ ...s, soalPerMateriDefault: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* Ticker */}
        <div>
          <p className="text-sm font-semibold text-muted mb-4" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pesan Ticker (satu per baris)</p>
          <p className="text-xs text-muted mb-10">Gunakan <code>{'{'}namaVariabel{'}'}</code> seperti <code>{'{totalUsers}'}</code> untuk nilai dinamis.</p>
          <textarea
            className="input"
            rows={8}
            style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }}
            value={tickers}
            onChange={e => setTickers(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-12" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ minWidth: 160 }} onClick={handleSave}>
            💾 Simpan Semua Pengaturan
          </button>
          {saved && <span className="badge badge-green">✓ Tersimpan!</span>}
          <button
            className="btn btn-ghost"
            style={{ color: 'var(--error)', borderColor: 'var(--error)', border: '1.5px solid', marginLeft: 'auto' }}
            onClick={handleReset}
          >
            🔄 Reset Semua Data ke Default
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── ROOT COMPONENT ───────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: '📊 Overview' },
  { id: 'soal',      label: '📚 Bank Soal' },
  { id: 'tryout',    label: '🎯 Paket Tryout' },
  { id: 'users',     label: '👥 Pengguna' },
  { id: 'settings',  label: '⚙️ Pengaturan' },
];

export default function AdminDashboard() {
  const { user, loginAdmin, logoutAdmin } = useStore();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!loginAdmin(password)) {
      setError('Password salah!');
    } else {
      setError('');
    }
  };

  if (user.role !== 'admin') {
    return (
      <div className="page animate-fade flex items-center justify-center">
        <div className="card" style={{ maxWidth: 400, width: '100%', marginTop: '10vh' }}>
          <div className="text-center mb-24">
            <div style={{
              width: 64, height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, var(--sky-500), var(--sky-600))',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(14,165,233,0.3)',
              marginBottom: 20
            }}>
              <img src={logoFace} alt="OTODU" style={{ width: 40, height: 40, objectFit: 'contain' }} />
            </div>
            <h2 className="title-md">Akses Admin</h2>
            <p className="text-muted text-sm mt-4">Silakan login untuk mengelola OTODUv3.</p>
          </div>
          <form onSubmit={handleLogin} className="flex flex-col gap-16">
            <input
              type="password"
              className="input"
              placeholder="Masukkan password admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            {error && <p className="text-error text-xs">{error}</p>}
            <button type="submit" className="btn btn-primary btn-block">Masuk</button>
            <button type="button" className="btn btn-ghost btn-block" onClick={() => navigate('/dashboard')}>
              Kembali ke Dashboard Siswa
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="page animate-fade" style={{ background: 'var(--surface-2)', minHeight: '100vh' }}>
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>

        {/* Header */}
        <div className="card-sky card" style={{ padding: '24px 32px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <img src={logoFull} alt="OTODU" style={{ height: 36, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <div>
              <h1 className="title-lg" style={{ color: 'white', letterSpacing: '-0.5px' }}>⚙️ Admin Panel</h1>
              <p style={{ opacity: 0.8, marginTop: 4 }}>Kelola konten, pengguna, dan pengaturan sistem OTODUv3.</p>
            </div>
          </div>
          <button onClick={() => { logoutAdmin(); navigate('/dashboard'); }} className="btn" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>
            Logout Admin
          </button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: '220px 1fr', gap: 24 }}>

          {/* Sidebar */}
          <div>
            <div className="card" style={{ padding: 12 }}>
              <div className="flex flex-col gap-4">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '11px 14px',
                      borderRadius: 8,
                      textAlign: 'left',
                      background: activeTab === tab.id ? 'var(--sky-100)' : 'transparent',
                      color: activeTab === tab.id ? 'var(--sky-700)' : 'var(--text-secondary)',
                      fontWeight: activeTab === tab.id ? 700 : 500,
                      fontSize: 14,
                      transition: 'all 0.18s',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {activeTab === 'overview'  && <TabOverview />}
            {activeTab === 'soal'      && <TabSoal />}
            {activeTab === 'tryout'    && <TabTryout />}
            {activeTab === 'users'     && <TabUsers />}
            {activeTab === 'settings'  && <TabSettings />}
          </div>

        </div>
      </div>
    </div>
  );
}
