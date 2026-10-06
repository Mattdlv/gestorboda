import React from 'react';

export default function QuickActions({ onAddGuest, onRegisterPayment, onShowPending, onShowFinance }) {
  return (
    <div className="quick-actions">
      <button type="button" className="quick-action primary" onClick={onRegisterPayment}>
        <span aria-hidden="true">＄</span> Registrar pago
      </button>
      <button type="button" className="quick-action" onClick={onAddGuest}>
        <span aria-hidden="true">＋</span> Agregar invitado
      </button>
      <button type="button" className="quick-action" onClick={onShowPending}>
        <span aria-hidden="true">◐</span> Ver pendientes
      </button>
      <button type="button" className="quick-action" onClick={onShowFinance}>
        <span aria-hidden="true">↗</span> Ver finanzas
      </button>
    </div>
  );
}
