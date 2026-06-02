import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  MODE_CONFIG,
  DAY_KEYS,
  DAY_LABELS,
  getModeConfig,
  getModeTargetText,
  getDayTargetRequirements,
  getTodayDayKey,
} from '../data/modes';

function buildOverrideForm(overrides, mode) {
  return Object.fromEntries(
    DAY_KEYS.map(dayKey => {
      const req = getDayTargetRequirements(mode, dayKey, overrides);
      const isCustom = overrides[dayKey] != null;
      return [dayKey, {
        enabled: isCustom,
        completedRequired: req.completedRequired,
        correctRequired: req.correctRequired,
      }];
    })
  );
}

export default function Settings() {
  const user = useStore(s => s.user);
  const dailyTargetOverrides = useStore(s => s.dailyTargetOverrides);
  const setUserName = useStore(s => s.setUserName);
  const scheduleModeChange = useStore(s => s.scheduleModeChange);
  const setDailyTargetOverrides = useStore(s => s.setDailyTargetOverrides);
  const applyTodayTargetRequirements = useStore(s => s.applyTodayTargetRequirements);

  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);
  const [dayTargets, setDayTargets] = useState(() =>
    buildOverrideForm(dailyTargetOverrides, user.mode)
  );

  const pendingMode = user.pendingMode ?? user.mode;
  const modeChangesTomorrow = pendingMode !== user.mode;
  const todayKey = getTodayDayKey();

  const handleSaveName = () => {
    setUserName(name);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const updateDayTarget = (dayKey, field, value) => {
    setDayTargets(prev => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }));
  };

  const resetDayTarget = (dayKey) => {
    const defaults = getDayTargetRequirements(user.mode, dayKey, {});
    setDayTargets(prev => ({
      ...prev,
      [dayKey]: {
        enabled: false,
        completedRequired: defaults.completedRequired,
        correctRequired: defaults.correctRequired,
      },
    }));
  };

  const handleSaveDayTargets = () => {
    const overrides = {};
    DAY_KEYS.forEach(dayKey => {
      const row = dayTargets[dayKey];
      if (row.enabled) {
        overrides[dayKey] = {
          completedRequired: Math.max(1, +row.completedRequired || 1),
          correctRequired: Math.max(1, +row.correctRequired || 1),
        };
      }
    });

    setDailyTargetOverrides(overrides);
    applyTodayTargetRequirements();
    setTargetSaved(true);
    setTimeout(() => setTargetSaved(false), 2000);
  };

  return (
    <div className="page animate-fade">
      <div className="container" style={{ maxWidth: 760, paddingTop: 40 }}>

        <h1 className="title-lg">⚙️ Pengaturan</h1>
        <p className="text-muted mt-8">Kelola preferensi umum akun belajarmu.</p>

        <div className="card mt-24">
          <h2 className="title-sm mb-16">👤 Profil</h2>
          <label className="text-sm font-semibold" htmlFor="user-name">Nama Tampilan</label>
          <div className="flex gap-12 mt-8" style={{ alignItems: 'center' }}>
            <input
              id="user-name"
              className="input"
              style={{ flex: 1 }}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nama kamu"
            />
            <button className="btn btn-primary" onClick={handleSaveName}>
              Simpan
            </button>
          </div>
          {saved && (
            <p className="text-xs text-muted mt-8" style={{ color: 'var(--success)' }}>
              ✓ Nama berhasil disimpan
            </p>
          )}
        </div>

        <div className="card mt-16">
          <h2 className="title-sm mb-8">🎯 Mode Belajar</h2>
          <p className="text-sm text-muted mb-16">
            Mode hari ini: <strong>{getModeConfig(user.mode).label}</strong>
            {modeChangesTomorrow && (
              <> · Berubah besok menjadi <strong>{getModeConfig(pendingMode).label}</strong></>
            )}
          </p>

          <div className="alert alert-warning mb-16">
            <span>⚠️</span>
            <p className="text-sm" style={{ lineHeight: 1.6 }}>
              Perubahan mode hanya berlaku mulai <strong>keesokan harinya</strong>.
              Hari ini kamu tetap menggunakan <strong>{getModeConfig(user.mode).label}</strong>.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {Object.values(MODE_CONFIG).map(m => {
              const isSelected = pendingMode === m.id;
              const isActiveToday = user.mode === m.id;

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => scheduleModeChange(m.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 14,
                    padding: '16px 18px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${isSelected ? 'var(--sky-500)' : 'var(--border)'}`,
                    background: isSelected ? 'var(--sky-50)' : 'var(--surface)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'var(--transition)',
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0, marginTop: 2,
                    border: `2px solid ${isSelected ? 'var(--sky-500)' : 'var(--gray-300)'}`,
                    background: isSelected ? 'var(--sky-500)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontSize: 12, fontWeight: 700,
                  }}>
                    {isSelected && '✓'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-8">
                      <span style={{ fontWeight: 700, fontSize: 14 }}>{m.label}</span>
                      {isActiveToday && (
                        <span className="badge badge-sky" style={{ fontSize: 11 }}>Aktif hari ini</span>
                      )}
                      {isSelected && !isActiveToday && (
                        <span className="badge badge-yellow" style={{ fontSize: 11 }}>Mulai besok</span>
                      )}
                    </div>
                    <p className="text-xs text-muted mt-4" style={{ lineHeight: 1.5 }}>{m.desc}</p>
                    <p className="text-xs mt-4" style={{ lineHeight: 1.5, color: 'var(--sky-700)' }}>
                      {m.audience}
                    </p>
                    <p className="text-xs font-semibold mt-4" style={{ color: 'var(--text-secondary)' }}>
                      Target default: {getModeTargetText(m.id)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="card mt-16">
          <h2 className="title-sm mb-8">📅 Target Harian per Hari</h2>
          <p className="text-sm text-muted mb-16">
            Atur target khusus untuk hari tertentu. Jika tidak diaktifkan, target mengikuti mode belajar.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DAY_KEYS.map(dayKey => {
              const row = dayTargets[dayKey];
              const isToday = dayKey === todayKey;

              return (
                <div
                  key={dayKey}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${isToday ? 'var(--sky-300)' : 'var(--border)'}`,
                    background: isToday ? 'var(--sky-50)' : 'var(--surface)',
                  }}
                >
                  <div className="flex items-center justify-between mb-10" style={{ flexWrap: 'wrap', gap: 8 }}>
                    <div className="flex items-center gap-8">
                      <label className="toggle" style={{ margin: 0 }}>
                        <input
                          type="checkbox"
                          checked={row.enabled}
                          onChange={e => updateDayTarget(dayKey, 'enabled', e.target.checked)}
                        />
                        <span className="toggle-slider" />
                      </label>
                      <span className="text-sm font-semibold">
                        {DAY_LABELS[dayKey]}
                        {isToday && (
                          <span className="badge badge-sky" style={{ fontSize: 10, marginLeft: 8 }}>Hari ini</span>
                        )}
                      </span>
                    </div>
                    {row.enabled && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => resetDayTarget(dayKey)}
                      >
                        Reset default
                      </button>
                    )}
                  </div>

                  {row.enabled && (
                    <div className="flex gap-12" style={{ flexWrap: 'wrap' }}>
                      <div style={{ flex: '1 1 120px' }}>
                        <label className="text-xs text-muted">Soal selesai</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          className="input mt-4"
                          value={row.completedRequired}
                          onChange={e => updateDayTarget(dayKey, 'completedRequired', e.target.value)}
                        />
                      </div>
                      <div style={{ flex: '1 1 120px' }}>
                        <label className="text-xs text-muted">Jawaban benar</label>
                        <input
                          type="number"
                          min={1}
                          max={100}
                          className="input mt-4"
                          value={row.correctRequired}
                          onChange={e => updateDayTarget(dayKey, 'correctRequired', e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <button className="btn btn-primary mt-16" onClick={handleSaveDayTargets}>
            Simpan Target Harian
          </button>
          {targetSaved && (
            <p className="text-xs text-muted mt-8" style={{ color: 'var(--success)' }}>
              ✓ Target harian berhasil disimpan
            </p>
          )}
        </div>

        <div className="card mt-16">
          <h2 className="title-sm mb-12">ℹ️ Informasi</h2>
          <ul className="text-sm text-muted" style={{ paddingLeft: 20, lineHeight: 1.8 }}>
            <li><strong>Speedrun</strong> — cocok jika waktu luang harianmu terbatas (25 selesai · 15 benar).</li>
            <li><strong>Santai</strong> — cocok jika waktu luang harianmu cukup (20 selesai · 17 benar).</li>
            <li>Target kustom per hari langsung diterapkan jika hari tersebut sedang aktif.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}
