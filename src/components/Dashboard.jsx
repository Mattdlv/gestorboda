import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { computeTotals } from '../utils/finance';
import { formatARS } from '../utils/format';
import './Dashboard.css';

export default function Dashboard({ guests, settings, children }) {
  const totals = computeTotals(guests, settings);
  const totalGuests = totals.guests;
  const partyGuests = totals.party;
  const kidsMenu = totals.kids;
  const totalCollected = totals.collected;
  const paidGuests = totals.statusCount.pagado;

  // Lugar listo: pagó todo su menú o va solo a ceremonia (no corresponde pago)
  const readyGuests = paidGuests + totals.statusCount.no_corresponde;
  const pendingGuests = totalGuests - readyGuests;

  const pieData = [
    { name: 'Lugar listo', value: readyGuests },
    { name: 'Con saldo pendiente', value: pendingGuests }
  ];
  
  // Paleta Boho: Terracota/Bronce suave y Verde Salvia
  const COLORS = ['#8A9A86', '#C49A76'];

  return (
    <div className="dashboard-wrapper">
      <div className="welcome-header">
        <span className="subtitle-top">Gestión del Casamiento</span>
        <h2>Nuestra Boda</h2>
        <p>¡Bienvenidos! Todo lo importante del gran día, en un solo lugar.</p>
      </div>

      {children}

      <div className="dashboard-grid">
        <section className="therapeutic-panel">
          <h3 className="panel-title">Estado Actual</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-value">{totalGuests}</div>
              <div className="stat-label">Total<br/>Invitados</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{partyGuests}</div>
              <div className="stat-label">Fiesta<br/>Confirmaciones</div>
            </div>
            
            <div className="stat-card icon-center">❀</div>

            <div className="stat-card">
              <div className="stat-value">{totals.ceremony}</div>
              <div className="stat-label">Solo<br/>Ceremonia</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{totals.adults}</div>
              <div className="stat-label">Adultos<br/>(Menú)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{kidsMenu}</div>
              <div className="stat-label">Niños<br/>(Kids)</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{paidGuests}</div>
              <div className="stat-label">Abonados</div>
            </div>

            <div className="stat-card icon-center">♥</div>

            <div className="stat-card" style={{gridColumn: 'span 2'}}>
               <div className="stat-value" style={{color: '#C49A76'}}>{formatARS(totalCollected)}</div>
               <div className="stat-label">Recaudado (ARS)</div>
            </div>
          </div>
        </section>

        <section className="therapeutic-panel border-gold">
          <h3 className="panel-title">Estado de Pagos</h3>
          <div className="chart-container">
            {totalGuests === 0 ? (
              <p className="empty-state">
                Aún no hay invitados registrados.<br/>
                Tómense su tiempo, ¡no hay prisa!
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="#F8F6F0" /* Borde para separar porciones como en la imagen */
                    strokeWidth={3}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid rgba(196, 154, 118, 0.4)',
                      backgroundColor: 'rgba(248, 246, 240, 0.95)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                      fontFamily: 'Lato, sans-serif'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          
          <div style={{display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem', zIndex: 1}}>
             <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}><span style={{display: 'inline-block', width: '10px', height:'10px', backgroundColor: '#8A9A86', marginRight: '5px'}}></span> Lugar listo</span>
             <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}><span style={{display: 'inline-block', width: '10px', height:'10px', backgroundColor: '#C49A76', marginRight: '5px'}}></span> Con saldo pendiente</span>
          </div>
        </section>
      </div>
    </div>
  );
}
