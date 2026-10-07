import React from 'react';
import FinancialSummaryCard from './FinancialSummaryCard';
import { formatARS } from '../../utils/format';

function MenuBlock({ title, count, price, cost, margin, unit, accent }) {
  return (
    <FinancialSummaryCard label={title} value={`${count} ${unit}`} accent={accent}>
      <div style={{ marginTop: '0.5rem' }}>
        <div className="menu-summary-row"><span>Venta</span><strong>{formatARS(price)}</strong></div>
        <div className="menu-summary-row"><span>Costo catering</span><strong>{formatARS(cost)}</strong></div>
        <div className="menu-summary-row"><span>Margen</span><strong style={{ color: '#5E7A5A' }}>{formatARS(margin)}</strong></div>
      </div>
    </FinancialSummaryCard>
  );
}

export default function MenuFinancialSummary({ totals }) {
  const { adulto, kids } = totals.byMenu;
  return (
    <div className="fin-grid">
      <MenuBlock title="Adultos" unit={adulto.count === 1 ? 'invitado' : 'invitados'} {...adulto} />
      <MenuBlock title="Kids" unit={kids.count === 1 ? 'invitado' : 'invitados'} {...kids} />
      <MenuBlock
        title="Total"
        unit={totals.menus === 1 ? 'menú' : 'menús'}
        count={totals.menus}
        price={totals.expected}
        cost={totals.cateringCost}
        margin={totals.expectedMargin}
        accent
      />
    </div>
  );
}
