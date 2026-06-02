import { useState } from 'react';
import { SUBJECTS } from '../../data/questions';
import {
  QUESTION_TYPES,
  SUBTESTS,
  EMPTY_QUESTION,
  inferSubtest,
  normalizeQuestion,
} from '../../data/questionTypes';

const PMK_CHOICES = ['Benar', 'Salah'];

export default function QuestionForm({ initialData, onSave, onCancel }) {
  const [q, setQ] = useState(() => {
    const base = initialData
      ? normalizeQuestion({ ...initialData, options: [...(initialData.options ?? [])] })
      : { ...EMPTY_QUESTION, options: [...EMPTY_QUESTION.options] };
    return base;
  });
  const [tagInput, setTagInput] = useState((initialData?.tags || []).join(', '));
  const [variantInput, setVariantInput] = useState((initialData?.answerVariants || []).join(', '));

  const setType = (questionType) => {
    setQ(prev => normalizeQuestion({
      ...prev,
      questionType,
      answer: questionType === 'is' ? '' : questionType === 'pmk' ? ['Benar', 'Salah'] : 'A',
      options: questionType === 'pg' ? (prev.options?.length === 5 ? prev.options : [...EMPTY_QUESTION.options]) : [],
      statements: questionType === 'pmk' ? (prev.statements?.length ? prev.statements : ['', '']) : [],
    }));
  };

  const handleSave = () => {
    if (!q.id.trim() || !q.question.trim()) return alert('ID dan pertanyaan wajib diisi!');

    if (q.questionType === 'pg' && !q.answer) return alert('Pilih kunci jawaban PG!');
    if (q.questionType === 'is' && !String(q.answer).trim()) return alert('Isi kunci jawaban isian singkat!');
    if (q.questionType === 'pmk') {
      const stmts = q.statements.filter(s => s.trim());
      if (stmts.length < 2) return alert('PMK minimal 2 pernyataan!');
    }

    onSave(normalizeQuestion({
      ...q,
      tags: tagInput.split(',').map(t => t.trim()).filter(Boolean),
      answerVariants: variantInput.split(',').map(t => t.trim()).filter(Boolean),
      stimulus: q.stimulus?.trim() ? q.stimulus.trim() : null,
      year: q.year ? +q.year : null,
      statements: q.questionType === 'pmk' ? q.statements.filter(s => s.trim()) : [],
    }));
  };

  const updateStatement = (index, value) => {
    const statements = [...q.statements];
    statements[index] = value;
    setQ(p => ({ ...p, statements }));
  };

  const updatePmkAnswer = (index, value) => {
    const answer = [...q.answer];
    answer[index] = value;
    setQ(p => ({ ...p, answer }));
  };

  const addStatement = () => {
    setQ(p => ({
      ...p,
      statements: [...p.statements, ''],
      answer: [...p.answer, 'Benar'],
    }));
  };

  const removeStatement = (index) => {
    if (q.statements.length <= 2) return;
    setQ(p => ({
      ...p,
      statements: p.statements.filter((_, i) => i !== index),
      answer: p.answer.filter((_, i) => i !== index),
    }));
  };

  const updateDistractor = (letter, value) => {
    setQ(p => ({
      ...p,
      distractorAnalysis: { ...p.distractorAnalysis, [letter]: value },
    }));
  };

  return (
    <div className="flex flex-col gap-16">
      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>ID Soal *</label>
          <input className="input" value={q.id} onChange={e => setQ(p => ({ ...p, id: e.target.value }))} placeholder="mis. MAT005" disabled={!!initialData} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Mata Pelajaran</label>
          <select
            className="input"
            value={q.subject}
            onChange={e => setQ(p => ({ ...p, subject: e.target.value, subtest: inferSubtest(e.target.value) }))}
          >
            {Object.entries(SUBJECTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Subtes UTBK</label>
          <select className="input" value={q.subtest} onChange={e => setQ(p => ({ ...p, subtest: e.target.value }))}>
            {Object.values(SUBTESTS).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tipe Soal *</label>
          <select className="input" value={q.questionType} onChange={e => setType(e.target.value)}>
            {Object.values(QUESTION_TYPES).map(t => (
              <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
            ))}
          </select>
          <p className="text-xs text-muted mt-4">{QUESTION_TYPES[q.questionType]?.desc}</p>
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tingkat Kesulitan</label>
          <select className="input" value={q.difficulty} onChange={e => setQ(p => ({ ...p, difficulty: +e.target.value }))}>
            <option value={1}>1 – Mudah</option>
            <option value={2}>2 – Sedang</option>
            <option value={3}>3 – Sulit</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Status</label>
          <select className="input" value={q.isActive ? 'active' : 'inactive'} onChange={e => setQ(p => ({ ...p, isActive: e.target.value === 'active' }))}>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>DINA Slip</label>
          <input type="number" step="0.01" min={0} max={1} className="input" value={q.dinaSlip} onChange={e => setQ(p => ({ ...p, dinaSlip: +e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>DINA Guess</label>
          <input type="number" step="0.01" min={0} max={1} className="input" value={q.dinaGuess} onChange={e => setQ(p => ({ ...p, dinaGuess: +e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tingkat Benar Komunitas</label>
          <input type="number" step="0.01" min={0} max={1} className="input" value={q.communityStats.correctRate} onChange={e => setQ(p => ({ ...p, communityStats: { ...p.communityStats, correctRate: +e.target.value } }))} />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tingkat Tepat Waktu</label>
          <input type="number" step="0.01" min={0} max={1} className="input" value={q.communityStats.ontimeRate} onChange={e => setQ(p => ({ ...p, communityStats: { ...p.communityStats, ontimeRate: +e.target.value } }))} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Sumber (opsional)</label>
          <input className="input" value={q.source} onChange={e => setQ(p => ({ ...p, source: e.target.value }))} placeholder="mis. Tryout Akbar #1" />
        </div>
        <div>
          <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tahun Referensi</label>
          <input type="number" className="input" value={q.year ?? ''} onChange={e => setQ(p => ({ ...p, year: e.target.value }))} placeholder="2027" />
        </div>
      </div>

      <div>
        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Stimulus / Bacaan (opsional)</label>
        <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={q.stimulus || ''} onChange={e => setQ(p => ({ ...p, stimulus: e.target.value }))} />
      </div>

      <div>
        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Pertanyaan *</label>
        <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={q.question} onChange={e => setQ(p => ({ ...p, question: e.target.value }))} />
      </div>

      {q.questionType === 'pg' && (
        <>
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 8 }}>Pilihan Jawaban (A–E)</label>
            <div className="flex flex-col gap-8">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                return (
                  <div key={i} className="flex gap-8 items-center">
                    <span style={{ fontWeight: 700, color: q.answer === letter ? 'var(--sky-600)' : 'var(--text-secondary)', width: 18, textAlign: 'center' }}>{letter}.</span>
                    <input className="input" style={{ flex: 1 }} value={opt} onChange={e => {
                      const opts = [...q.options];
                      opts[i] = e.target.value;
                      setQ(p => ({ ...p, options: opts }));
                    }} />
                    <button
                      className={`btn btn-sm ${q.answer === letter ? 'btn-primary' : 'btn-ghost'}`}
                      style={{ minWidth: 80 }}
                      onClick={() => setQ(p => ({ ...p, answer: letter }))}
                      type="button"
                    >
                      {q.answer === letter ? '✓ Kunci' : 'Jadikan Kunci'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 8 }}>Analisis Distraktor (opsi salah)</label>
            <div className="flex flex-col gap-8">
              {['A', 'B', 'C', 'D', 'E'].filter(l => l !== q.answer).map(letter => (
                <div key={letter}>
                  <label className="text-xs text-muted">Opsi {letter}</label>
                  <input
                    className="input mt-4"
                    value={q.distractorAnalysis[letter] ?? ''}
                    onChange={e => updateDistractor(letter, e.target.value)}
                    placeholder={`Mengapa ${letter} salah...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {q.questionType === 'is' && (
        <>
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Kunci Jawaban *</label>
            <input className="input" value={q.answer} onChange={e => setQ(p => ({ ...p, answer: e.target.value }))} placeholder="mis. 5 atau logaritma" />
          </div>
          <div>
            <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Varian Jawaban Diterima (pisah koma)</label>
            <input className="input" value={variantInput} onChange={e => setVariantInput(e.target.value)} placeholder="mis. lima, 5.0" />
          </div>
        </>
      )}

      {q.questionType === 'pmk' && (
        <div>
          <div className="flex justify-between items-center mb-8">
            <label className="text-xs text-muted">Pernyataan & Kunci Benar/Salah</label>
            <button type="button" className="btn btn-ghost btn-sm" onClick={addStatement}>+ Tambah Pernyataan</button>
          </div>
          <div className="flex flex-col gap-10">
            {q.statements.map((stmt, i) => (
              <div key={i} className="grid gap-8" style={{ gridTemplateColumns: '1fr 120px 40px', alignItems: 'end' }}>
                <div>
                  <label className="text-xs text-muted">Pernyataan {i + 1}</label>
                  <textarea className="input mt-4" rows={2} value={stmt} onChange={e => updateStatement(i, e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-muted">Kunci</label>
                  <select className="input mt-4" value={q.answer[i] ?? 'Benar'} onChange={e => updatePmkAnswer(i, e.target.value)}>
                    {PMK_CHOICES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeStatement(i)} disabled={q.statements.length <= 2}>✕</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Pembahasan</label>
        <textarea className="input" rows={3} style={{ resize: 'vertical' }} value={q.explanation} onChange={e => setQ(p => ({ ...p, explanation: e.target.value }))} />
      </div>

      <div>
        <label className="text-xs text-muted" style={{ display: 'block', marginBottom: 4 }}>Tags (pisah koma)</label>
        <input className="input" value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="mis. aljabar, persamaan-linear" />
      </div>

      <div className="flex gap-8 justify-end mt-8">
        <button className="btn btn-ghost" onClick={onCancel} type="button">Batal</button>
        <button className="btn btn-primary" onClick={handleSave} type="button">💾 Simpan Soal</button>
      </div>
    </div>
  );
}
