import React, { useMemo, useState } from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import PaymentProgress from './PaymentProgress';
import MenuFinancialSummary from './MenuFinancialSummary';
import GuestFinancialCard from './GuestFinancialCard';
import ExpensesPanel from './ExpensesPanel';
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

  const marginSecuredPct = totals.expectedMargin > 0 ? totals.securedMargin / totals.expectedMargin : 0;

  return (
    <div className="fin-section" style={{ gap: '3rem', animation: 'fade-in-slow 0.8s ease forwards' }}>
      {/* Dinero */}
      <section className="fin-section" aria-labelledby="money-title">
        <h2 id="money-title" className="fin-section-title">Finanzas</h2>
        <p className="fin-section-sub">Todo se calcula a partir de la lista de invitados.</p>
        <div className="fin-grid">
          <FinancialSummaryCard label="Total esperado" value={formatARS(totals.expected)} hint={`${totals.menus} menús de fiesta`} accent>
            <PaymentProgress progress={totals.progress} label="Progreso de cobro" />
          </FinancialSummaryCard>
          <FinancialSummaryCard label="Total cobrado" tone="ok" icon="✓" value={formatARS(totals.collected)}
            hint={totals.overpaid > 0 ? `Incluye ${formatARS(totals.overpaid)} pagados de más` : `${totals.statusCount.pagado} invitados con todo pagado`} />
          <FinancialSummaryCard label="Total pendiente" tone="warn" icon="◐" value={formatARS(totals.pending)}
            hint={`${totals.statusCount.sin_pago} sin pago · ${totals.statusCount.parcial} parciales`} />
        </div>
      </section>

      {/* Catering y margen */}
      <section className="fin-section" aria-labelledby="catering-title">
        <h2 id="catering-title" className="fin-section-title">Catering y margen</h2>
        <div className="fin-grid">
          <FinancialSummaryCard label="Costo real catering" icon="🍽" value={formatARS(totals.cateringCost)}
            hint={`${totals.adults} Adulto · ${totals.kids} Kids`} />
          <FinancialSummaryCard label="Margen esperado" tone="info" icon="↗" value={formatARS(totals.expectedMargin)}
            hint="Ventas esperadas − costo del catering" />
          <FinancialSummaryCard label="Margen ya asegurado" tone="ok" value={formatARS(totals.securedMargin)}
            hint="Parte del margen que ya cobramos por encima del costo de cada menú">
            <PaymentProgress progress={marginSecuredPct} tone="ok" label="Margen asegurado" />
          </FinancialSummaryCard>
        </div>
        <div className="fin-note">
          <span aria-hidden="true">ℹ︎</span>
          <span>
            El margen <strong>no es dinero disponible</strong>: es lo que esperamos que quede a favor cuando todos paguen
            y se cubra el catering. Hoy faltan cobrar {formatARS(totals.pending)}.
          </span>
        </div>
        <MenuFinancialSummary totals={totals} />
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
