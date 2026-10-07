import React from 'react';
import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentProgress from './PaymentProgress';
import { formatARS, formatDate } from '../../utils/format';
import { getGuestFinance, getAttendanceLabel } from '../../utils/finance';

export default function GuestFinancialCard({ guest, settings, onOpen }) {
  const f = getGuestFinance(guest, settings);
  const tone = f.status === 'pagado' ? 'ok' : 'warn';

  return (
    <button type="button" className="guest-fin-card" onClick={() => onOpen(guest.id)}>
      <div className="guest-fin-head">
        <div style={{ minWidth: 0 }}>
          <div className="guest-fin-name">{guest.name}</div>
          <div className="guest-fin-meta">{getAttendanceLabel(guest, f)}</div>
        </div>
        <PaymentStatusBadge status={f.status} />
      </div>

      {f.price > 0 ? (
        <>
          <div className="guest-fin-amounts">
            <div><small>Total</small><strong>{formatARS(f.price)}</strong></div>
            <div><small>Pagado</small><strong>{formatARS(f.paid)}</strong></div>
            <div><small>Pendiente</small><strong>{formatARS(f.remaining)}</strong></div>
          </div>
          <PaymentProgress progress={f.progress} tone={tone} />
        </>
      ) : (
        <div className="guest-fin-meta">
          Sin menú: no genera costo ni deuda.
          {f.paid > 0 && ` Tiene ${formatARS(f.paid)} registrados (revisar devolución).`}
        </div>
      )}

      {f.overpaid > 0 && f.price > 0 && (
        <div className="guest-fin-meta">Pagó {formatARS(f.overpaid)} de más.</div>
      )}
      {f.lastPaymentDate && (
        <div className="guest-fin-meta">Último pago: {formatDate(f.lastPaymentDate)}</div>
      )}
    </button>
  );
}
