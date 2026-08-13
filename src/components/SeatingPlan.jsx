import React, { useMemo } from 'react';

export default function SeatingPlan({ guests }) {
  // 1. Filtrar solo a los que van a la fiesta
  const partyGuests = useMemo(() => {
    return guests.filter(g => g.attendance === 'fiesta');
  }, [guests]);

  // 2. Agrupar por mesa
  const tables = useMemo(() => {
    const grouped = partyGuests.reduce((acc, guest) => {
      const mesaKey = (guest.mesa && guest.mesa.trim() !== '' && guest.mesa !== 'Sin asignar') 
        ? `Mesa ${guest.mesa}` 
        : 'Pendientes de Ubicar';
      
      if (!acc[mesaKey]) {
        acc[mesaKey] = [];
      }
      acc[mesaKey].push(guest);
      return acc;
    }, {});

    return grouped;
  }, [partyGuests]);

  // Extraer "Pendientes de Ubicar" para ponerlo primero o resaltarlo
  const pendingGuests = tables['Pendientes de Ubicar'] || [];
  
  // Filtrar el resto de mesas y ordenarlas lógicamente
  const assignedTables = Object.keys(tables)
    .filter(key => key !== 'Pendientes de Ubicar')
    .sort((a, b) => {
      const numA = parseInt(a.replace('Mesa ', '')) || 0;
      const numB = parseInt(b.replace('Mesa ', '')) || 0;
      return numA - numB;
    });

  // Helper para mostrar un ícono según el menú
  const getMenuIcon = (menu) => {
    if (menu === 'celiaco') return '🌾 Celíaco';
    if (menu === 'kids') return '🍟 Infantil';
    return '🥩 Adulto';
  };

  const renderTableCard = (tableName, tableGuests, isWarning = false) => {
    const celiacos = tableGuests.filter(g => g.menu === 'celiaco').length;
    const ninos = tableGuests.filter(g => g.menu === 'kids').length;

    return (
      <div 
        key={tableName} 
        className={`premium-panel ${isWarning ? '' : 'border-gold'}`} 
        style={{ 
          padding: '2rem', 
          borderColor: isWarning ? 'var(--accent-terracota)' : undefined,
          boxShadow: isWarning ? '0 0 15px rgba(196, 154, 118, 0.15)' : 'var(--shadow-neumorphic)'
        }}
      >
        <h3 style={{ 
          fontSize: '1.4rem', 
          marginBottom: '0.5rem',
          color: isWarning ? 'var(--accent-terracota)' : 'var(--text-main)',
          textAlign: 'center' 
        }}>
          {tableName}
        </h3>
        
        <div style={{ 
          textAlign: 'center', 
          fontSize: '0.85rem', 
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid var(--border-gold)'
        }}>
          🧍‍♂️ {tableGuests.length} Personas
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, minHeight: '100px' }}>
          {tableGuests.map(g => (
            <li key={g.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '0.5rem 0',
              borderBottom: '1px dashed rgba(0,0,0,0.05)'
            }}>
              <span style={{ fontFamily: 'Playfair Display, serif', fontSize: '1.1rem' }}>{g.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{getMenuIcon(g.menu)}</span>
            </li>
          ))}
        </ul>

        {/* Resumen del Catering */}
        {(celiacos > 0 || ninos > 0) && (
          <div style={{ 
            marginTop: '1.5rem', 
            padding: '1rem', 
            backgroundColor: 'rgba(255,255,255,0.5)',
            borderRadius: '12px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <strong style={{ display: 'block', marginBottom: '0.5rem' }}>Nota para Catering:</strong>
            {celiacos > 0 && <div style={{ color: 'var(--accent-terracota)' }}>• {celiacos} Menú(s) Celíaco</div>}
            {ninos > 0 && <div>• {ninos} Menú(s) Infantil</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ animation: 'fade-in-slow 1s ease forwards' }}>
      {/* Grilla de Mesas CSS Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2.5rem' 
      }}>
        {/* Renderizar "Pendientes" primero si los hay */}
        {pendingGuests.length > 0 && renderTableCard('Pendientes de Ubicar', pendingGuests, true)}

        {/* Renderizar el resto de mesas */}
        {assignedTables.map(tableName => renderTableCard(tableName, tables[tableName]))}
      </div>

      {partyGuests.length === 0 && (
         <section className="premium-panel">
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay invitados asignados a la fiesta aún.</p>
        </section>
      )}
    </div>
  );
}
