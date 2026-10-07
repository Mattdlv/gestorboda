import React from 'react';
import { formatARS } from '../../utils/format';

// La plata ya cobrada, separada en lo que va para el catering y lo que queda para nosotros.
export default function CollectedSplit({ totals }) {
  const total = totals.collectedForCatering + totals.collectedForUs;
  const cateringPct = total > 0 ? (totals.collectedForCatering / total) * 100 : 0;
  const rows = [
    { key: 'adulto', label: 'Adultos', data: totals.byMenu.adulto },
    { key: 'kids', label: 'Kids', data: totals.byMenu.kids },
  ];

  return (
    <section className="split" aria-labelledby="split-title">
      <div className="split-head">
        <span id="split-title" className="peace-kicker">Plata cobrada</span>
        <span className="split-total">{formatARS(total)}</span>
      </div>

      <div className="split-bar" aria-hidden="true">
        <span className="split-bar-catering" style={{ width: `${cateringPct}%` }} />
        <span className="split-bar-us" style={{ width: `${100 - cateringPct}%` }} />
      </div>

      <div className="split-parts">
        <div>
          <span className="split-label"><i className="split-dot catering" /> Para el catering</span>
          <strong className="split-value">{formatARS(totals.collectedForCatering)}</strong>
        </div>
        <div>
          <span className="split-label"><i className="split-dot us" /> Nos queda a nosotros</span>
          <strong className="split-value us">{formatARS(totals.collectedForUs)}</strong>
        </div>
      </div>

      <div className="split-rows">
        {rows.map(({ key, label, data }) => (
          <div key={key} className="split-row">
            <div className="split-row-name">
              <strong>{label}</strong>
              <span>{data.paidCount} de {data.count} pagaron todo</span>
            </div>
            <div className="split-row-nums">
              <span><small>Cobrado</small>{formatARS(data.paid)}</span>
              <span><small>Catering</small>{formatARS(data.forCatering)}</span>
              <span className="us"><small>Nosotros</small>{formatARS(data.forUs)}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="split-foot">
        Falta cobrar <strong>{formatARS(totals.pending)}</strong>.
        {' '}Si alguien pagó una parte, esa plata cubre primero su menú del catering.
      </p>
    </section>
  );
}
