import React, { useMemo, useState } from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import PaymentProgress from './PaymentProgress';
import MenuFinancialSummary from './MenuFinancialSummary';
import GuestFinancialCard from './GuestFinancialCard';
import ExpensesPanel from './ExpensesPanel';
import CollectedSplit from './CollectedSplit';
import { formatARS } from '../../utils/format';
import { getGuestFinance } from '../../utils/finance';

const FINANCE_FILTERS = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendientes', label: 'Pendientes' },
  { id: 'parciales', label: 'Pagos parciales' },
  { id: 'pagados', label: 'Pagados' },
  { id: 'adultos', label: 'Adultos' },
  { id: 'kids', label: 'Kids' },
  { id: 'ceremonia', label: 'Ceremonia' },
];

const matchesFilter = (filter, f) => {
  switch (filter) {
    case 'pendientes': return f.status === 'sin_pago' || f.status === 'parcial';
    case 'parciales': return f.status === 'parcial';
    case 'pagados': return f.status === 'pagado';
    case 'adultos': return f.category === 'adulto';
    case 'kids': return f.category === 'kids';
    case 'ceremonia': return f.status === 'no_corresponde';
    default: return true;
  }
};

const STATUS_ORDER = { sin_pago: 0, parcial: 1, pagado: 2, no_corresponde: 3 };

const SORTS = {
  nombre: { label: 'Nombre', fn: (a, b) => (a.guest.name || '').localeCompare(b.guest.name || '', 'es') },
  mayor_deuda: { label: 'Mayor deuda', fn: (a, b) => b.f.remaining - a.f.remaining },
  menor_deuda: { label: 'Menor deuda', fn: (a, b) => a.f.remaining - b.f.remaining },
  estado: { label: 'Estado', fn: (a, b) => STATUS_ORDER[a.f.status] - STATUS_ORDER[b.f.status] },
  ultimo_pago: { label: 'Último pago', fn: (a, b) => (b.f.lastPaymentDate || '').localeCompare(a.f.lastPaymentDate || '') },
};

export default function FinancialDashboard({ guests, settings, totals, expenses, expenseSummary, expensesError, expenseActions, filter, onFilterChange, onOpenPayments }) {
  const [sort, setSort] = useState('mayor_deuda');
  const [search, setSearch] = useState('');

  const rows = useMemo(() => guests.map((guest) => ({ guest, f: getGuestFinance(guest, settings) })), [guests, settings]);

  const counts = useMemo(() => Object.fromEntries(
    FINANCE_FILTERS.map(({ id }) => [id, rows.filter((r) => matchesFilter(id, r.f)).length])
  ), [rows]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((r) => matchesFilter(filter, r.f))
      .filter((r) => !q || (r.guest.name || '').toLowerCase().includes(q))
      .sort((a, b) => SORTS[sort].fn(a, b) || SORTS.nombre.fn(a, b));
  }, [rows, filter, sort, search]);

  return (
    <div className="fin-section" style={{ gap: '3rem', animation: 'fade-in-slow 0.8s ease forwards' }}>
      <section className="fin-section" aria-labelledby="money-title">
        <h2 id="money-title" className="fin-section-title">Finanzas</h2>
        <CollectedSplit totals={totals} />
        {totals.needsMenuReview > 0 && (
          <div className="fin-banner tone-warn">
            {totals.needsMenuReview} invitado(s) de fiesta sin menú válido: no se cuentan en los cálculos hasta que se les asigne uno.
          </div>
        )}
      </section>

      {/* Invitados */}
      <section className="fin-section" aria-labelledby="guests-fin-title">
        <h2 id="guests-fin-title" className="fin-section-title">Pagos por invitado</h2>
        <div className="fin-chips" role="group" aria-label="Filtrar por estado">
          {FINANCE_FILTERS.map(({ id, label }) => (
            <button key={id} type="button" className="fin-chip" aria-pressed={filter === id} onClick={() => onFilterChange(id)}>
              {label}<span className="fin-chip-count">{counts[id]}</span>
            </button>
          ))}
        </div>
        <div className="fin-toolbar">
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre..." aria-label="Buscar invitado" />
          <select className="fin-select" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar por">
            {Object.entries(SORTS).map(([id, s]) => <option key={id} value={id}>Ordenar: {s.label}</option>)}
          </select>
        </div>
        {visible.length === 0 ? (
          <p className="fin-empty">No hay invitados en este filtro.</p>
        ) : (
          <div className="guest-fin-list">
            {visible.map(({ guest }) => (
              <GuestFinancialCard key={guest.id} guest={guest} settings={settings} onOpen={onOpenPayments} />
            ))}
          </div>
        )}
      </section>

      <details className="fin-more">
        <summary>Ver proyección completa (cuando todos paguen)</summary>
        <div className="fin-section">
          <div className="fin-grid">
            <FinancialSummaryCard label="Total esperado" value={formatARS(totals.expected)} hint={`${totals.menus} menús de fiesta`} accent>
              <PaymentProgress progress={totals.progress} label="Progreso de cobro" />
            </FinancialSummaryCard>
            <FinancialSummaryCard label="Costo total catering" value={formatARS(totals.cateringCost)}
              hint={`${totals.adults} Adulto · ${totals.kids} Kids`} />
            <FinancialSummaryCard label="Nos quedaría" tone="ok" value={formatARS(totals.expectedMargin)}
              hint="Cuando todos terminen de pagar" />
          </div>
          <MenuFinancialSummary totals={totals} />
          {totals.overpaid > 0 && (
            <p className="fin-empty">Hay {formatARS(totals.overpaid)} pagados de más por algunos invitados (no se cuentan arriba).</p>
          )}
        </div>
      </details>

      <ExpensesPanel
        expenses={expenses}
        summary={expenseSummary}
        cateringCost={totals.cateringCost}
        error={expensesError}
        onAdd={expenseActions.addExpense}
        onUpdate={expenseActions.updateExpense}
        onDelete={expenseActions.deleteExpense}
      />
    </div>
  );
}
