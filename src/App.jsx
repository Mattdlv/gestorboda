import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Dashboard from './components/Dashboard';
import GuestForm from './components/GuestForm';
import GuestTable from './components/GuestTable';
import GuestFilters from './components/GuestFilters';
import SeatingPlan from './components/SeatingPlan';
import Navigation from './components/Navigation';
import { VIEWS } from './utils/navigation';
import PeaceOfMindPanel from './components/finance/PeaceOfMindPanel';
import QuickActions from './components/finance/QuickActions';
import FinancialDashboard from './components/finance/FinancialDashboard';
import FinancialSettings from './components/finance/FinancialSettings';
import PaymentModal from './components/finance/PaymentModal';
import { useGuests } from './hooks/useGuests';
import { useFinanceSettings } from './hooks/useFinanceSettings';
import { useExpenses } from './hooks/useExpenses';
import { getGuestFinance, computeTotals, computeExpenses, getPeaceOfMind } from './utils/finance';
import './App.css';
import './components/finance/finance.css';

// La sección activa vive en el hash (#finanzas) para que sobreviva al refrescar
const readView = () => {
  const hash = window.location.hash.replace('#', '');
  return VIEWS.some((v) => v.id === hash) ? hash : 'dashboard';
};

function App() {
  const { guests, loading, error, addGuest, updateGuest, deleteGuest, addPayment, updatePayment, deletePayment } = useGuests();
  const { settings, isDefault: settingsIsDefault, error: settingsError, saveSettings } = useFinanceSettings();
  const { expenses, error: expensesError, addExpense, updateExpense, deleteExpense } = useExpenses();

  const [view, setView] = useState(readView);
  const [financeFilter, setFinanceFilter] = useState('todos');
  const [paymentModal, setPaymentModal] = useState(null); // { guestId } | null
  const guestFormRef = useRef(null);
  const [focusGuestForm, setFocusGuestForm] = useState(false);

  const [filters, setFilters] = useState({
    searchQuery: '',
    status: 'all',
    attendance: 'all',
    grupo: 'all'
  });

  useEffect(() => {
    const onHash = () => setView(readView());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = useCallback((next) => {
    if (window.location.hash !== `#${next}`) window.location.hash = next;
    setView(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // "Agregar invitado" desde el Dashboard: ir a Invitados y enfocar el formulario
  useEffect(() => {
    if (!focusGuestForm || view !== 'invitados' || !guestFormRef.current) return;
    guestFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    guestFormRef.current.querySelector('input')?.focus({ preventScroll: true });
    setFocusGuestForm(false);
  }, [focusGuestForm, view]);

  const totals = useMemo(() => computeTotals(guests, settings), [guests, settings]);
  const expenseSummary = useMemo(() => computeExpenses(expenses), [expenses]);
  const peace = getPeaceOfMind(expenseSummary);

  // Derived state: filtramos la lista antes de pasarla a la tabla
  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Búsqueda por texto (Nombre)
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const query = filters.searchQuery.toLowerCase();
        if (!(guest.name || '').toLowerCase().includes(query)) return false;
      }

      // Filtro de Asistencia
      if (filters.attendance !== 'all' && guest.attendance !== filters.attendance) return false;

      // Filtro de Grupo
      const guestGroup = guest.grupo || 'Familia';
      if (filters.grupo !== 'all' && guestGroup !== filters.grupo) return false;

      // Filtro de Pago
      if (filters.status !== 'all') {
        const isReady = getGuestFinance(guest, settings).status === 'pagado';

        if (filters.status === 'ready' && !isReady) return false;
        if (filters.status === 'pending' && isReady) return false;
      }

      return true;
    });
  }, [guests, filters, settings]);

  const openPayments = useCallback((guestId = null) => setPaymentModal({ guestId }), []);
  const closePayments = useCallback(() => setPaymentModal(null), []);

  return (
    <div className="app-container">
      <Navigation view={view} onChange={navigate} />

      {error && (
        <div className="premium-panel" style={{ textAlign: 'center', color: 'var(--accent-terracota)' }}>
          No se pudo conectar con la base de datos ({error.code || error.message}).<br/>
          Revisá la conexión y recargá la página.
        </div>
      )}
      {loading && !error && (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Cargando invitados...</p>
      )}

      {view === 'dashboard' && (
        <Dashboard guests={guests} settings={settings}>
          <PeaceOfMindPanel totals={totals} expenseSummary={expenseSummary} peace={peace} />
          <QuickActions
            onRegisterPayment={() => openPayments()}
            onAddGuest={() => { setFocusGuestForm(true); navigate('invitados'); }}
            onShowPending={() => { setFinanceFilter('pendientes'); navigate('finanzas'); }}
            onShowFinance={() => { setFinanceFilter('todos'); navigate('finanzas'); }}
          />
        </Dashboard>
      )}

      {view === 'invitados' && (
        <div style={{ animation: 'fade-in-slow 0.8s ease forwards', display: 'flex', flexDirection: 'column', gap: '3.5rem' }}>
          <GuestForm onSubmit={addGuest} settings={settings} formRef={guestFormRef} />
          <GuestFilters filters={filters} setFilters={setFilters} />
          <GuestTable
            guests={filteredGuests}
            settings={settings}
            onUpdate={updateGuest}
            onDelete={deleteGuest}
            onOpenPayments={openPayments}
          />
        </div>
      )}

      {view === 'finanzas' && (
        <FinancialDashboard
          guests={guests}
          settings={settings}
          totals={totals}
          expenses={expenses}
          expenseSummary={expenseSummary}
          expensesError={expensesError}
          expenseActions={{ addExpense, updateExpense, deleteExpense }}
          filter={financeFilter}
          onFilterChange={setFinanceFilter}
          onOpenPayments={openPayments}
        />
      )}

      {view === 'mesas' && <SeatingPlan guests={guests} />}

      {view === 'configuracion' && (
        <FinancialSettings
          key={JSON.stringify(settings)}
          settings={settings}
          isDefault={settingsIsDefault}
          error={settingsError}
          onSave={saveSettings}
        />
      )}

      {paymentModal && (
        <PaymentModal
          guests={guests}
          guestId={paymentModal.guestId}
          settings={settings}
          onClose={closePayments}
          onAddPayment={addPayment}
          onUpdatePayment={updatePayment}
          onDeletePayment={deletePayment}
        />
      )}
    </div>
  );
}

export default App;
