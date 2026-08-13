import React, { useState, useMemo } from 'react';
import Dashboard from './components/Dashboard';
import GuestForm from './components/GuestForm';
import GuestTable from './components/GuestTable';
import GuestFilters from './components/GuestFilters';
import SeatingPlan from './components/SeatingPlan';
import { useGuests } from './hooks/useGuests';
import { calculateCost, getAmountPaid } from './utils/constants';
import './App.css';

function App() {
  const { guests, addGuest, updateGuest, deleteGuest } = useGuests();
  
  const [viewMode, setViewMode] = useState('list'); // 'list' o 'plan'

  const [filters, setFilters] = useState({
    searchQuery: '',
    status: 'all',
    attendance: 'all',
    grupo: 'all'
  });

  // Derived state: filtramos la lista antes de pasarla a la tabla
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Búsqueda por texto (Nombre)
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        if (!guest.name.toLowerCase().includes(query)) return false;
      }

      // Filtro de Asistencia
      if (filters.attendance !== 'all' && guest.attendance !== filters.attendance) return false;
      
      // Filtro de Grupo
      const guestGroup = guest.grupo || 'Familia'; 
      if (filters.grupo !== 'all' && guestGroup !== filters.grupo) return false;
      
      // Filtro de Pago
      if (filters.status !== 'all') {
        const cost = calculateCost(guest.menu, guest.attendance);
        const paid = getAmountPaid(guest);
        const isReady = paid >= cost && guest.attendance === 'fiesta';
        
        if (filters.status === 'ready' && !isReady) return false;
        if (filters.status === 'pending' && isReady) return false;
      }
      
      return true;
    });
  }, [guests, filters]);

  // Tab Styles
  const tabContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '1rem' // Reducido para no dejar tanto espacio muerto
  };

  const getTabStyle = (isActive) => ({
    padding: '1rem 2.5rem',
    borderRadius: '30px',
    border: isActive ? 'none' : '1px solid var(--border-gold)',
    background: isActive ? 'var(--text-muted)' : 'rgba(255, 255, 255, 0.4)',
    color: isActive ? '#fff' : 'var(--text-main)',
    fontFamily: 'Lato, sans-serif',
    fontSize: '0.95rem',
    fontWeight: isActive ? '700' : '400',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: isActive ? '0 4px 15px rgba(95, 103, 90, 0.3)' : 'none',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  });

  return (
    <div className="app-container">
      {/* El Dashboard siempre se muestra */}
      <Dashboard guests={guests} />
      
      {/* Botonera de navegación */}
      <div style={tabContainerStyle}>
        <button 
          style={getTabStyle(viewMode === 'list')} 
          onClick={() => setViewMode('list')}
        >
          Lista de Invitados
        </button>
        <button 
          style={getTabStyle(viewMode === 'plan')} 
          onClick={() => setViewMode('plan')}
        >
          Plano de Salón
        </button>
      </div>
      
      {/* Renderizado Condicional */}
      {viewMode === 'list' ? (
        <div style={{ animation: 'fade-in-slow 0.8s ease forwards' }}>
          <GuestForm onSubmit={addGuest} />
          <GuestFilters filters={filters} setFilters={setFilters} />
          <GuestTable 
            guests={filteredGuests} 
            onUpdate={updateGuest} 
            onDelete={deleteGuest} 
          />
        </div>
      ) : (
        <SeatingPlan guests={guests} />
      )}
    </div>
  );
}

export default App;
