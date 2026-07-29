import { useState, useEffect } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

function App() {
  const [guests, setGuests] = useState(() => {
    const savedGuests = localStorage.getItem('weddingGuests');
    return savedGuests ? JSON.parse(savedGuests) : [];
  });

  const [formData, setFormData] = useState({
    name: '',
    attendance: 'ceremonia',
    menu: 'adulto',
    payment: 'pendiente'
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    localStorage.setItem('weddingGuests', JSON.stringify(guests));
  }, [guests]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const newGuest = {
      id: Date.now(),
      ...formData
    };

    setGuests([...guests, newGuest]);
    setFormData({ name: '', attendance: 'ceremonia', menu: 'adulto', payment: 'pendiente' });
  };

  const startEditing = (guest) => {
    setEditingId(guest.id);
    setEditData(guest);
  };

  const saveEdit = () => {
    setGuests(guests.map(g => g.id === editingId ? editData : g));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Seguro que deseas eliminar este invitado?')) {
      setGuests(guests.filter(guest => guest.id !== id));
    }
  };

  const totalGuests = guests.length;
  const partyGuests = guests.filter(g => g.attendance === 'fiesta').length;
  const kidsMenu = guests.filter(g => g.menu === 'kids').length;
  const paidCards = guests.filter(g => g.payment === 'abonado').length;

  // Data for the Pie Chart
  const pieData = [
    { name: 'Abonado', value: paidCards },
    { name: 'Pendiente', value: totalGuests - paidCards }
  ];
  const COLORS = ['#10b981', '#ef4444'];

  return (
    <div className="app-container">
      <header className="header">
        <h1><span>Nuestra</span> Boda</h1>
        <p>Gestión de Invitados</p>
      </header>

      <div className="dashboard-grid">
        <section className="premium-panel">
          <h2>Resumen</h2>
          <div className="stats-container">
            <div className="stat-card">
              <div className="stat-value">{totalGuests}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{partyGuests}</div>
              <div className="stat-label">Fiesta</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{kidsMenu}</div>
              <div className="stat-label">Niños</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{paidCards}</div>
              <div className="stat-label">Abonados</div>
            </div>
          </div>
        </section>

        <section className="premium-panel">
          <h2>Estado de Pagos</h2>
          <div className="chart-container">
            {totalGuests === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Agrega invitados para ver las estadísticas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      </div>

      <section className="premium-panel">
        <h2>Agregar Invitado</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Nombre y Apellido</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej. Juan Pérez"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Asistencia</label>
              <select name="attendance" value={formData.attendance} onChange={handleInputChange}>
                <option value="ceremonia">Solo Ceremonia</option>
                <option value="fiesta">Ceremonia y Fiesta</option>
              </select>
            </div>

            <div className="input-group">
              <label>Menú</label>
              <select name="menu" value={formData.menu} onChange={handleInputChange}>
                <option value="adulto">Adulto</option>
                <option value="kids">Kids</option>
              </select>
            </div>

            <div className="input-group">
              <label>Pago</label>
              <select name="payment" value={formData.payment} onChange={handleInputChange}>
                <option value="pendiente">Pendiente</option>
                <option value="abonado">Abonado</option>
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn-primary">Añadir a la Lista</button>
        </form>
      </section>

      <section className="premium-panel">
        <h2>Lista de Invitados</h2>
        {guests.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay invitados registrados todavía.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Asistencia</th>
                  <th>Menú</th>
                  <th>Estado Pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => (
                  <tr key={guest.id}>
                    {editingId === guest.id ? (
                      <>
                        <td>
                          <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="inline-input" />
                        </td>
                        <td>
                          <select name="attendance" value={editData.attendance} onChange={handleEditChange} className="inline-select">
                            <option value="ceremonia">Solo Ceremonia</option>
                            <option value="fiesta">Ceremonia + Fiesta</option>
                          </select>
                        </td>
                        <td>
                          <select name="menu" value={editData.menu} onChange={handleEditChange} className="inline-select">
                            <option value="adulto">Adulto</option>
                            <option value="kids">Kids</option>
                          </select>
                        </td>
                        <td>
                          <select name="payment" value={editData.payment} onChange={handleEditChange} className="inline-select">
                            <option value="pendiente">Pendiente</option>
                            <option value="abonado">Abonado</option>
                          </select>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action btn-save" onClick={saveEdit}>Guardar</button>
                            <button className="btn-action btn-delete" onClick={cancelEdit}>Cancelar</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="guest-name">{guest.name}</td>
                        <td>
                          <div className="status-indicator">
                            <span className={`dot ${guest.attendance === 'ceremonia' ? 'gray' : 'gold'}`}></span>
                            {guest.attendance === 'ceremonia' ? 'Solo Ceremonia' : 'Ceremonia + Fiesta'}
                          </div>
                        </td>
                        <td>
                          <div className="status-indicator">
                            {guest.menu === 'adulto' ? 'Adulto' : 'Niños (Kids)'}
                          </div>
                        </td>
                        <td>
                          <div className="status-indicator">
                            <span className={`dot ${guest.payment === 'abonado' ? 'green' : 'red'}`}></span>
                            {guest.payment === 'abonado' ? 'Abonado' : 'Pendiente'}
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action btn-edit" onClick={() => startEditing(guest)}>Editar</button>
                            <button className="btn-action btn-delete" onClick={() => handleDelete(guest.id)}>Eliminar</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
