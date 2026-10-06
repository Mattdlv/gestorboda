import React from 'react';

// progress: 0..1 (null = no corresponde)
export default function PaymentProgress({ progress, tone = 'ok', size, label }) {
  if (progress === null || progress === undefined) return null;
  const pct = Math.round(Math.max(0, Math.min(1, progress)) * 100);
  return (
    <div className={`fin-progress tone-${tone} ${size === 'lg' ? 'lg' : ''}`}>
      <div
        className="fin-progress-track"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progreso de pago'}
      >
        <div className="fin-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="fin-progress-label">{pct}%</span>
    </div>
  );
}
