import React from 'react';
import { formatARS, formatDate } from '../../utils/format';
import { PAYMENT_METHODS } from '../../utils/finance';

const methodLabel = (value) => PAYMENT_METHODS.find((m) => m.value === value)?.label || '';

export default function PaymentHistory({ payments, onEdit, onDelete, busy }) {
  if (payments.length === 0) {
    return <p className="fin-empty">Todavía no hay pagos registrados.</p>;
  }

  const sorted = [...payments].sort((a, b) => (a.date || '').localeCompare(b.date || ''));

  return (
    <ul className="pay-history">
      {sorted.map((p) => {
        const meta = [
          p.date ? formatDate(p.date) : 'Sin fecha',
          methodLabel(p.method),
          p.note,
        ].filter(Boolean).join(' · ');
        return (
          <li key={p.id} className="pay-item">
            <span className="pay-item-amount">{formatARS(p.amount)}</span>
            <span className="pay-item-meta">{meta}</span>
            <div className="pay-item-actions">
              <button type="button" className="btn-action btn-edit" onClick={() => onEdit(p)} disabled={busy}>Editar</button>
              <button type="button" className="btn-action btn-delete" onClick={() => onDelete(p)} disabled={busy}>Quitar</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
