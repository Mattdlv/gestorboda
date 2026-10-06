import React, { useState } from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import { formatARS, formatDate, todayISO, daysBetween } from '../../utils/format';
import { EXPENSE_CATEGORIES, getExpenseCategoryLabel } from '../../utils/finance';

const emptyExpense = () => ({ name: '', category: 'catering', amount: '', date: '', status: 'pendiente', note: '' });

// Pagos a proveedores. Primera versión simple: alta, marcar pagado, corregir y quitar.
export default function ExpensesPanel({ expenses, summary, cateringCost, error, onAdd, onUpdate, onDelete }) {
  const [form, setForm] = useState(emptyExpense);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const today = todayISO();

  const handleChange = (e) => {
    setFormError('');
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const reset = () => {
    setForm(emptyExpense());
    setEditingId(null);
    setOpen(false);
    setFormError('');
  };

  const save = async (action) => {
    setBusy(true);
    try {
      await action();
      return true;
    } catch {
      setFormError('No se pudo guardar. Revisá la conexión o los permisos de Firebase.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.name.trim()) return setFormError('Poné un nombre (ej. "Seña catering").');
    if (!Number.isFinite(amount) || amount <= 0) return setFormError('Ingresá un monto mayor a $0.');
    const ok = await save(() => (editingId ? onUpdate(editingId, { ...form, amount }) : onAdd({ ...form, amount })));
    if (ok) reset();
  };

  const startEdit = (exp) => {
    setForm({ ...emptyExpense(), ...exp, amount: String(exp.amount ?? '') });
    setEditingId(exp.id);
    setOpen(true);
  };

  const togglePaid = (exp) =>
    save(() => onUpdate(exp.id, { ...exp, status: exp.status === 'pagado' ? 'pendiente' : 'pagado' }));

  const remove = (exp) => {
    if (window.confirm(`¿Quitar "${exp.name}"?`)) save(() => onDelete(exp.id));
  };

  const sorted = [...expenses].sort((a, b) => {
    if ((a.status === 'pagado') !== (b.status === 'pagado')) return a.status === 'pagado' ? 1 : -1;
    return (a.date || '9999').localeCompare(b.date || '9999');
  });

  const cateringRemaining = Math.max(0, cateringCost - summary.cateringPaid);

  return (
    <section className="fin-section" aria-labelledby="expenses-title">
      <h2 id="expenses-title" className="fin-section-title">Proveedores y pagos</h2>
      <p className="fin-section-sub">Lo que nosotros pagamos. Separado del costo estimado del catering.</p>

      {error && (
        <div className="fin-banner tone-warn">
          No se pudieron cargar los gastos ({error.code || error.message}). Puede que las reglas de Firebase no permitan la colección "expenses".
        </div>
      )}

      <div className="fin-grid">
        <FinancialSummaryCard
          label="Pagado al catering"
          value={formatARS(summary.cateringPaid)}
          tone="ok"
          hint={`Del costo estimado ${formatARS(cateringCost)} faltan ${formatARS(cateringRemaining)}`}
        />
        <FinancialSummaryCard
          label="Catering programado"
          value={formatARS(summary.cateringScheduled)}
          tone="warn"
          hint="Pagos al catering con fecha, todavía no realizados"
        />
        <FinancialSummaryCard
          label="Otros gastos"
          value={formatARS(summary.otherPaid + summary.otherScheduled)}
          hint={`${formatARS(summary.otherPaid)} pagado · ${formatARS(summary.otherScheduled)} por pagar`}
        />
      </div>

      {sorted.length === 0 && !open && (
        <p className="fin-empty">Todavía no registraron pagos a proveedores. Pueden agregar la seña del catering, el salón, la fotografía…</p>
      )}

      {sorted.length > 0 && (
        <ul className="pay-history">
          {sorted.map((exp) => {
            const isPaid = exp.status === 'pagado';
            const days = exp.date ? daysBetween(today, exp.date) : null;
            let tone = 'info';
            let label = 'Por pagar';
            if (isPaid) { tone = 'ok'; label = 'Pagado'; }
            else if (days !== null && days < 0) { tone = 'alert'; label = 'Atrasado'; }
            else if (days !== null && days <= 14) { tone = 'warn'; label = days === 0 ? 'Vence hoy' : `En ${days} días`; }
            return (
              <li key={exp.id} className="expense-item">
                <span className="expense-item-name">{exp.name}</span>
                <span className="expense-item-meta">
                  {[getExpenseCategoryLabel(exp.category), exp.date && formatDate(exp.date), exp.note].filter(Boolean).join(' · ')}
                </span>
                <div className="expense-item-side">
                  <span className="expense-item-amount">{formatARS(exp.amount)}</span>
                  <span className={`fin-badge tone-${tone}`}>{label}</span>
                </div>
                <div className="action-buttons" style={{ gridColumn: '1 / -1', flexWrap: 'wrap', gap: '0.25rem' }}>
                  <button type="button" className="btn-action btn-save" onClick={() => togglePaid(exp)} disabled={busy}>
                    {isPaid ? 'Marcar por pagar' : 'Marcar pagado'}
                  </button>
                  <button type="button" className="btn-action btn-edit" onClick={() => startEdit(exp)} disabled={busy}>Editar</button>
                  <button type="button" className="btn-action btn-delete" onClick={() => remove(exp)} disabled={busy}>Quitar</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {formError && !open && <p role="alert" style={{ color: '#A5543F', textAlign: 'center' }}>{formError}</p>}

      {open ? (
        <form className="fin-card accent modal-form" onSubmit={handleSubmit} noValidate>
          <div className="input-group span-2">
            <label htmlFor="expName">Nombre</label>
            <input id="expName" name="name" value={form.name} onChange={handleChange} placeholder="Ej. Seña catering" autoFocus />
          </div>
          <div className="input-group">
            <label htmlFor="expCategory">Categoría</label>
            <select id="expCategory" name="category" value={form.category} onChange={handleChange}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="expAmount">Monto (ARS)</label>
            <input id="expAmount" name="amount" type="number" inputMode="numeric" min="1" value={form.amount} onChange={handleChange} />
          </div>
          <div className="input-group">
            <label htmlFor="expStatus">Estado</label>
            <select id="expStatus" name="status" value={form.status} onChange={handleChange}>
              <option value="pendiente">Por pagar</option>
              <option value="pagado">Pagado</option>
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="expDate">{form.status === 'pagado' ? 'Fecha de pago' : 'Vencimiento'}</label>
            <input id="expDate" name="date" type="date" value={form.date} onChange={handleChange} />
          </div>
          <div className="input-group span-2">
            <label htmlFor="expNote">Nota (opcional)</label>
            <input id="expNote" name="note" value={form.note} onChange={handleChange} />
          </div>
          {formError && <p className="span-2" role="alert" style={{ color: '#A5543F' }}>{formError}</p>}
          <div className="modal-actions span-2">
            <button type="button" className="btn-secondary" onClick={reset} disabled={busy}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={busy}>{editingId ? 'Guardar cambios' : 'Agregar'}</button>
          </div>
        </form>
      ) : (
        <button type="button" className="btn-secondary" style={{ alignSelf: 'center' }} onClick={() => setOpen(true)}>
          ＋ Agregar pago a proveedor
        </button>
      )}
    </section>
  );
}
