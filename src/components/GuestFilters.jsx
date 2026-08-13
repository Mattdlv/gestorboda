import React from 'react';

export default function GuestFilters({ filters, setFilters }) {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="premium-panel" style={{ padding: '2rem 3rem', marginBottom: '2rem' }}>
      <h3 style={{ 
        fontSize: '1.1rem', 
        marginBottom: '1.5rem', 
        textAlign: 'center', 
        fontFamily: 'Lato, sans-serif', 
        textTransform: 'uppercase', 
        letterSpacing: '2px', 
        color: 'var(--accent-terracota)' 
      }}>
        Buscador y Filtros
      </h3>
      
      {/* Buscador de texto completo */}
      <div className="input-group" style={{ marginBottom: '1.5rem' }}>
        <input 
          type="text" 
          name="searchQuery" 
          value={filters.searchQuery || ''} 
          onChange={handleFilterChange} 
          placeholder="🔍 Buscar por nombre del invitado..." 
          style={{ 
            width: '100%', 
            padding: '0.8rem 1rem', 
            borderRadius: '8px', 
            border: '1px solid var(--border-gold)',
            fontSize: '1rem'
          }}
        />
      </div>

      <div className="form-grid" style={{ marginBottom: 0 }}>
        
        <div className="input-group">
          <label htmlFor="filterStatus">Estado de Pago</label>
          <select id="filterStatus" name="status" value={filters.status} onChange={handleFilterChange}>
            <option value="all">Todos</option>
            <option value="ready">Lugar Listo (Pagado)</option>
            <option value="pending">Por Confirmar (Con Deuda)</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="filterAttendance">Asistencia</label>
          <select id="filterAttendance" name="attendance" value={filters.attendance} onChange={handleFilterChange}>
            <option value="all">Todos</option>
            <option value="fiesta">Ceremonia y Fiesta</option>
            <option value="ceremonia">Solo Ceremonia</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="filterGroup">Grupo</label>
          <select id="filterGroup" name="grupo" value={filters.grupo} onChange={handleFilterChange}>
            <option value="all">Todos</option>
            <option value="Familia">Familia</option>
            <option value="Amigos">Amigos</option>
            <option value="Trabajo">Trabajo</option>
            <option value="Otros">Otros</option>
          </select>
        </div>

      </div>
    </section>
  );
}
