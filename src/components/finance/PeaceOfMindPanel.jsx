import React from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import { formatARS, formatDateLong } from '../../utils/format';
import { getExpenseCategoryLabel } from '../../utils/finance';

// Vista "Tranquilidad": responde de un vistazo cuánto se cobró, cuánto falta,
// cuánto cuesta el catering, cuánto se espera que quede a favor y si hay algo urgente.
export default function PeaceOfMindPanel({ totals, expenseSummary, peace }) {
  const pct = Math.round(totals.progress * 100);
  const next = expenseSummary.nextPayment;
  const overdue = expenseSummary.overdue;

  return (
    <section className="peace" aria-labelledby="peace-title">
      <div className="peace-head">
        <div className="peace-ring" style={{ '--p': pct }} aria-hidden="true">
          <div className="peace-ring-value">
            {pct}%
            <span className="peace-ring-label">cobrado</span>
          </div>
        </div>
        <div>
          <span className="peace-kicker">Casamiento</span>
          <h2 id="peace-title" className="peace-title">
            <span aria-hidden="true">{peace.icon}</span> {peace.title}
          </h2>
          <p className="peace-detail">
            {totals.expected > 0
              ? `Ya cobramos ${formatARS(totals.collectedTowardsExpected)} de ${formatARS(totals.expected)} esperados por los menús.`
              : 'Todavía no hay menús de fiesta registrados.'}
            {' '}{peace.detail}
          </p>
        </div>
      </div>

      <div className="fin-grid">
        <FinancialSummaryCard label="Cobrado" icon="✓" tone="ok" value={formatARS(totals.collected)} hint="Pagos recibidos de invitados" />
        <FinancialSummaryCard label="Falta cobrar" icon="◐" tone="warn" value={formatARS(totals.pending)} hint="Saldo de los menús, sin vencimiento" />
        <FinancialSummaryCard label="Costo catering" icon="🍽" value={formatARS(totals.cateringCost)} hint={`${totals.menus} menús a precio real`} />
        <FinancialSummaryCard label="Margen esperado" icon="↗" tone="info" value={formatARS(totals.expectedMargin)} hint="Cuando todos paguen. No es dinero disponible hoy." />
      </div>

      {overdue.length > 0 && (
        <div className="peace-next tone-alert">
          <span>Atrasado: {overdue.map((e) => e.name || getExpenseCategoryLabel(e.category)).join(', ')}</span>
          <strong>{formatARS(overdue.reduce((a, e) => a + (Number(e.amount) || 0), 0))}</strong>
        </div>
      )}

      {next ? (
        <div className={`peace-next ${expenseSummary.upcoming.includes(next) ? 'tone-warn' : 'tone-info'}`}>
          <span>Próximo pago: {next.name || getExpenseCategoryLabel(next.category)} · {formatDateLong(next.date)}</span>
          <strong>{formatARS(next.amount)}</strong>
        </div>
      ) : overdue.length === 0 && (
        <div className="peace-next tone-ok">
          <span>No hay pagos a proveedores programados ni atrasados.</span>
        </div>
      )}
    </section>
  );
}
