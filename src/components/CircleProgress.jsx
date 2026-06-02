export default function CircleProgress({
  completed,
  total,
  correct,
  correctTotal,
  size = 168,
  strokeWidth = 14,
}) {
  const donePct = total > 0 ? Math.min(1, completed / total) : 0;
  const correctPct = correctTotal > 0 ? Math.min(1, correct / correctTotal) : 0;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const doneOffset = circumference * (1 - donePct);
  const correctOffset = circumference * (1 - correctPct);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', display: 'block' }}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--gray-200)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--sky-500)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={doneOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={correctOffset}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--sky-700)', lineHeight: 1 }}>
            {completed}/{total}
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--success)', marginTop: 6, lineHeight: 1 }}>
            {correct}/{correctTotal}
          </span>
        </div>
      </div>
    </div>
  );
}
