import React from 'react';
import GuestRow from './GuestRow';

export default function GuestTable({ guests, onUpdate, onDelete }) {
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
        <table>
          <thead>
            <tr>
              <th>Nombre y Grupo</th>
              <th>Presencia</th>
              <th>Menú</th>
              <th>Progreso de Pago</th>
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
              />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
