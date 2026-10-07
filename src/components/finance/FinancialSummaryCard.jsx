import React from 'react';

export default function FinancialSummaryCard({ label, value, hint, tone = 'neutral', icon, accent = false, children }) {
  return (
    <div className={`fin-card tone-${tone} ${accent ? 'accent' : ''}`}>
      <span className="fin-card-label">
        {icon && <span aria-hidden="true">{icon}</span>}
        {label}
      </span>
      <span className="fin-card-value">{value}</span>
      {hint && <span className="fin-card-hint">{hint}</span>}
      {children}
    </div>
  );
}
