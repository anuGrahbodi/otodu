import { getQuestionTypeConfig } from '../../data/questionTypes';

const PMK_CHOICES = ['Benar', 'Salah'];

export default function QuestionInput({ question, userAnswer, onChange }) {
  const type = question.questionType ?? 'pg';
  const typeConfig = getQuestionTypeConfig(type);

  if (type === 'is') {
    return (
      <div>
        <p className="text-sm text-muted mb-8">
          {typeConfig.icon} {typeConfig.label} — ketik jawaban singkat kamu
        </p>
        <input
          className="input"
          style={{ fontSize: 16, padding: '14px 16px' }}
          value={userAnswer ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="Tulis jawaban..."
        />
      </div>
    );
  }

  if (type === 'pmk') {
    const values = Array.isArray(userAnswer) ? userAnswer : [];

    return (
      <div>
        <p className="text-sm text-muted mb-12">
          {typeConfig.icon} {typeConfig.label} — tentukan Benar/Salah tiap pernyataan
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {question.statements.map((stmt, i) => {
            const selected = values[i];
            return (
              <div key={i} className="card" style={{ padding: '14px 16px' }}>
                <p className="text-sm font-semibold mb-10">{i + 1}. {stmt}</p>
                <div className="flex gap-8">
                  {PMK_CHOICES.map(choice => (
                    <button
                      key={choice}
                      type="button"
                      className={`btn btn-sm ${selected === choice ? 'btn-primary' : 'btn-ghost'}`}
                      onClick={() => {
                        const next = [...values];
                        while (next.length < question.statements.length) next.push('');
                        next[i] = choice;
                        onChange(next);
                      }}
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {question.options.map((opt, oi) => {
        const label = ['A', 'B', 'C', 'D', 'E'][oi];
        const isSelected = userAnswer === label;
        return (
          <div
            key={label}
            className={`soal-option ${isSelected ? 'selected' : ''}`}
            onClick={() => onChange(label)}
          >
            <div className={`option-label ${isSelected ? 'selected' : ''}`}>{label}</div>
            <span style={{ fontSize: 14, lineHeight: 1.6 }}>{opt.slice(3)}</span>
          </div>
        );
      })}
    </div>
  );
}
