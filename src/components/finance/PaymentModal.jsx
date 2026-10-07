import React, { useEffect, useMemo, useState } from 'react';
import PaymentHistory from './PaymentHistory';
import PaymentStatusBadge from './PaymentStatusBadge';
import PaymentProgress from './PaymentProgress';
import { formatARS, todayISO } from '../../utils/format';
import {
  getGuestFinance, previewPayment, getAttendanceLabel, PAYMENT_METHODS, PAYMENT_STATUS,
} from '../../utils/finance';

const emptyForm = () => ({ amount: '', date: todayISO(), method: 'transferencia', note: '' });

export default function PaymentModal({ guests, guestId, settings, onClose, onAddPayment, onUpdatePayment, onDeletePayment }) {
  const [selectedId, setSelectedId] = useState(guestId || null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // pago que se está corrigiendo
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Cerrar con Escape y bloquear el scroll de fondo
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const guest = guests.find((g) => g.id === selectedId) || null;
  const finance = guest ? getGuestFinance(guest, settings) : null;

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return guests
      .map((g) => ({ guest: g, finance: getGuestFinance(g, settings) }))
      .filter(({ guest: g }) => !q || (g.name || '').toLowerCase().includes(q))
      .sort((a, b) => b.finance.remaining - a.finance.remaining || (a.guest.name || '').localeCompare(b.guest.name || ''));
  }, [guests, settings, search]);

  const amount = Number(form.amount);
  const amountValid = form.amount !== '' && Number.isFinite(amount) && amount > 0;

  // Base para la vista previa: si se edita un pago, se descuenta su monto anterior
  const baseFinance = finance && editing
    ? { ...finance, paid: finance.paid - editing.amount }
    : finance;
  const preview = baseFinance && amountValid ? previewPayment(baseFinance, amount) : null;
  const pendingBefore = baseFinance ? Math.max(0, baseFinance.price - baseFinance.paid) : 0;

  const handleChange = (e) => {
    setError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const startEdit = (payment) => {
    setEditing(payment);
    setError('');
    setForm({
      amount: String(payment.amount),
      date: payment.date || '',
      method: payment.method || '',
      note: payment.legacy ? '' : (payment.note || ''),
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setForm(emptyForm());
    setError('');
  };

  const run = async (action) => {
    setBusy(true);
    setError('');
    try {
      await action();
      return true;
    } catch {
      setError('No se pudo guardar. Revisá la conexión e intentá de nuevo.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountValid) {
      setError('Ingresá un monto mayor a $0.');
      return;
    }
    if (finance.price > 0 && amount > pendingBefore) {
      const ok = window.confirm(
        `El pago (${formatARS(amount)}) supera el saldo pendiente (${formatARS(pendingBefore)}).\n¿Querés registrarlo igual?`
      );
      if (!ok) return;
    }
    const payment = { ...form, amount, note: form.note || (editing?.legacy ? editing.note : '') };
    const ok = editing
      ? await run(() => onUpdatePayment(guest.id, editing.id, payment, settings))
      : await run(() => onAddPayment(guest.id, payment, settings));
    if (ok) {
      setEditing(null);
      setForm(emptyForm());
    }
  };

  const handleDelete = async (payment) => {
    if (!window.confirm(`¿Quitar el pago de ${formatARS(payment.amount)}? Esta acción corrige el historial.`)) return;
    if (editing?.id === payment.id) cancelEdit();
    await run(() => onDeletePayment(guest.id, payment.id, settings));
  };

  const canAddPayment = finance && (finance.price > 0 || editing);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
        <div className="modal-header">
          <div style={{ minWidth: 0 }}>
            <span className="peace-kicker">Registrar pago</span>
            <h2 id="payment-modal-title" className="modal-title">
              {guest ? guest.name : 'Elegí un invitado'}
            </h2>
            {guest && <span className="guest-fin-meta">{getAttendanceLabel(guest, finance)}</span>}
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {!guest ? (
          <>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar invitado..."
              aria-label="Buscar invitado"
              autoFocus
            />
            <ul className="modal-search-list">
              {candidates.length === 0 && <li className="fin-empty">No encontramos invitados con ese nombre.</li>}
              {candidates.map(({ guest: g, finance: f }) => (
                <li key={g.id}>
                  <button type="button" className="modal-search-item" onClick={() => setSelectedId(g.id)}>
                    <span style={{ minWidth: 0 }}>
                      <span style={{ display: 'block', fontWeight: 700 }}>{g.name}</span>
                      <span className="guest-fin-meta">
                        {f.price > 0 ? `Pendiente ${formatARS(f.remaining)}` : 'Solo ceremonia'}
                      </span>
                    </span>
                    <PaymentStatusBadge status={f.status} />
                  </button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            {finance.price > 0 ? (
              <>
                <div className="modal-summary">
                  <div><small>Total</small><strong>{formatARS(finance.price)}</strong></div>
                  <div><small>Pagado</small><strong>{formatARS(finance.paid)}</strong></div>
                  <div><small>Pendiente</small><strong>{formatARS(finance.remaining)}</strong></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <PaymentProgress progress={finance.progress} tone={finance.status === 'pagado' ? 'ok' : 'warn'} />
                  </div>
                  <PaymentStatusBadge status={finance.status} />
                </div>
              </>
            ) : (
              <div className="fin-banner tone-info">
                Solo asiste a la ceremonia: no tiene menú ni saldo a pagar.
                {finance.paid > 0 && ` Tiene ${formatARS(finance.paid)} registrados; podés corregirlos abajo.`}
              </div>
            )}

            {canAddPayment && (
              <form className="modal-form" onSubmit={handleSubmit} noValidate>
                <div className="input-group span-2">
                  <label htmlFor="payAmount">{editing ? 'Corregir monto' : 'Nuevo pago'} (ARS)</label>
                  <input
                    id="payAmount"
                    name="amount"
                    type="number"
                    inputMode="numeric"
                    min="1"
                    step="1"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder={finance.remaining > 0 ? `Ej. ${finance.remaining}` : 'Monto'}
                    autoFocus
                  />
                </div>
                <div className="input-group">
                  <label htmlFor="payDate">Fecha</label>
                  <input id="payDate" name="date" type="date" value={form.date} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label htmlFor="payMethod">Método (opcional)</label>
                  <select id="payMethod" name="method" value={form.method} onChange={handleChange}>
                    <option value="">Sin especificar</option>
                    {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="input-group span-2">
                  <label htmlFor="payNote">Nota (opcional)</label>
                  <input id="payNote" name="note" type="text" value={form.note} onChange={handleChange} placeholder="Ej. Primera cuota" />
                </div>

                {preview && finance.price > 0 && (
                  <div className={`modal-preview span-2 tone-${PAYMENT_STATUS[preview.status].tone}`}>
                    <div className="modal-preview-row"><span>Nuevo total pagado</span><strong>{formatARS(preview.paid)}</strong></div>
                    <div className="modal-preview-row"><span>Pendiente</span><strong>{formatARS(preview.remaining)}</strong></div>
                    {preview.overpaid > 0 && (
                      <div className="modal-preview-row"><span>Excedente</span><strong>{formatARS(preview.overpaid)}</strong></div>
                    )}
                    <div className="modal-preview-row"><span>Estado</span><PaymentStatusBadge status={preview.status} /></div>
                  </div>
                )}

                {error && <p className="span-2" role="alert" style={{ color: '#A5543F', fontSize: '0.9rem' }}>{error}</p>}

                <div className="modal-actions span-2">
                  {editing && <button type="button" className="btn-secondary" onClick={cancelEdit} disabled={busy}>Cancelar</button>}
                  <button type="submit" className="btn-primary" disabled={busy}>
                    {busy ? 'Guardando...' : editing ? 'Guardar corrección' : 'Registrar pago'}
                  </button>
                </div>
              </form>
            )}

            <div>
              <h3 className="fin-card-label" style={{ marginBottom: '0.75rem' }}>Historial de pagos</h3>
              <PaymentHistory payments={finance.payments} onEdit={startEdit} onDelete={handleDelete} busy={busy} />
            </div>

            {error && !canAddPayment && <p role="alert" style={{ color: '#A5543F', fontSize: '0.9rem' }}>{error}</p>}

            {!guestId && (
              <button type="button" className="btn-secondary" onClick={() => { setSelectedId(null); cancelEdit(); }}>
                ← Elegir otro invitado
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
