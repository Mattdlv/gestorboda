import React from 'react';
import GuestRow from './GuestRow';

export default function GuestTable({ guests, settings, onUpdate, onDelete, onOpenPayments }) {
  if (guests.length === 0) {
    return (
      <section className="premium-panel">
        <h2>Nuestra Lista</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay invitados que coincidan con estos filtros.</p>
      </section>
    );
  }

  return (
    <section className="premium-panel">
      <h2>Nuestra Lista</h2>
      <div className="table-container">
        <table className="guest-table">
          <thead>
            <tr>
              <th>Nombre y Grupo</th>
              <th>Presencia</th>
              <th>Menú</th>
              <th>Pagos</th>
              <th>Mesa</th>
              <th>Ajustes</th>
            </tr>
          </thead>
          <tbody>
            {guests.map((guest) => (
              <GuestRow 
                key={guest.id} 
                guest={guest} 
                onUpdate={onUpdate} 
                onDelete={onDelete}
                settings={settings}
                onOpenPayments={onOpenPayments}
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
