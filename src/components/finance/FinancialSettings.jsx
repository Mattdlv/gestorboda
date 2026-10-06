import React, { useState } from 'react';
import { formatARS } from '../../utils/format';
import { MENU_CATEGORIES } from '../../utils/finance';

// Costos y precios por menú. El margen se calcula solo, nunca se escribe a mano.
export default function FinancialSettings({ settings, isDefault, error, onSave }) {
  const [draft, setDraft] = useState(() => toDraft(settings));
  const [status, setStatus] = useState(null); // 'saving' | 'saved' | 'error'
  const [message, setMessage] = useState('');

  const handleChange = (menu, field) => (e) => {
    setStatus(null);
    setDraft({ ...draft, [menu]: { ...draft[menu], [field]: e.target.value } });
  };

  const values = Object.fromEntries(
    Object.keys(MENU_CATEGORIES).map((key) => {
      const cost = Number(draft[key].cost);
      const price = Number(draft[key].price);
      return [key, { cost, price, valid: Number.isFinite(cost) && Number.isFinite(price) && cost > 0 && price > 0 }];
    })
  );
  const allValid = Object.values(values).every((v) => v.valid);
  const dirty = Object.keys(MENU_CATEGORIES).some(
    (k) => values[k].cost !== settings.menus[k].cost || values[k].price !== settings.menus[k].price
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allValid) {
      setStatus('error');
      setMessage('Revisá que todos los valores sean mayores a $0.');
      return;
    }
    const negative = Object.entries(values).filter(([, v]) => v.price < v.cost);
    if (negative.length && !window.confirm('El precio de venta quedó por debajo del costo del catering (margen negativo). ¿Guardar igual?')) return;

    setStatus('saving');
    try {
      await onSave({ menus: Object.fromEntries(Object.entries(values).map(([k, v]) => [k, { cost: v.cost, price: v.price }])) });
      setStatus('saved');
      setMessage('Guardado. Todos los cálculos ya usan los nuevos valores.');
    } catch (err) {
      setStatus('error');
      setMessage(`No se pudo guardar (${err.code || err.message}). Revisá los permisos de Firebase para "settings".`);
    }
  };

  return (
    <section className="premium-panel" aria-labelledby="settings-title">
      <h2 id="settings-title">Configuración financiera</h2>
      <p className="fin-section-sub" style={{ marginTop: '-1.5rem', marginBottom: '2rem' }}>
        El <strong>costo</strong> es lo que nos cobra el catering. El <strong>precio</strong> es lo que paga cada invitado.
      </p>

      {error && (
        <div className="fin-banner tone-warn" style={{ marginBottom: '1.5rem' }}>
          No se pudo leer la configuración guardada; se usan los valores por defecto.
        </div>
      )}
      {!error && isDefault && (
        <div className="fin-banner tone-info" style={{ marginBottom: '1.5rem' }}>
          Usando valores iniciales. Al guardar, quedan guardados para todos los dispositivos.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="settings-grid">
          {Object.entries(MENU_CATEGORIES).map(([key, label]) => {
            const v = values[key];
            const margin = v.valid ? v.price - v.cost : null;
            return (
              <div key={key} className="fin-card accent">
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.75rem' }}>{label}</h3>
                <div className="input-group" style={{ marginBottom: '1rem' }}>
                  <label htmlFor={`${key}-cost`}>Costo catering (ARS)</label>
                  <input id={`${key}-cost`} type="number" inputMode="numeric" min="1" value={draft[key].cost} onChange={handleChange(key, 'cost')} />
                </div>
                <div className="input-group">
                  <label htmlFor={`${key}-price`}>Precio al invitado (ARS)</label>
                  <input id={`${key}-price`} type="number" inputMode="numeric" min="1" value={draft[key].price} onChange={handleChange(key, 'price')} />
                </div>
                <div className="settings-margin">
                  <span className="fin-card-label">Margen por menú</span>
                  <strong style={margin !== null && margin < 0 ? { color: '#A5543F' } : undefined}>
                    {margin === null ? '—' : formatARS(margin)}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>

        {status && status !== 'saving' && (
          <div className={`fin-banner tone-${status === 'saved' ? 'ok' : 'alert'}`} role="status" style={{ marginTop: '1.5rem' }}>
            {message}
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ marginTop: '2rem' }} disabled={status === 'saving' || (!dirty && !isDefault)}>
          {status === 'saving' ? 'Guardando...' : 'Guardar valores'}
        </button>
      </form>

      <p className="fin-section-sub" style={{ marginTop: '2rem', fontSize: '0.85rem' }}>
        El menú celíaco se calcula como Adulto. Cada registro de invitado cuenta como un menú.
      </p>
    </section>
  );
}

function toDraft(settings) {
  return Object.fromEntries(
    Object.keys(MENU_CATEGORIES).map((k) => [k, { cost: String(settings.menus[k].cost), price: String(settings.menus[k].price) }])
  );
}
