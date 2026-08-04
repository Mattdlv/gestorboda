import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebase';
import Dashboard, { calculateCost, getAmountPaid } from './components/Dashboard';
import './App.css';

function App() {
  const [guests, setGuests] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    attendance: 'fiesta', 
    menu: 'adulto',
    amountPaid: ''
  });

  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    // Sincronización en tiempo real con Firebase
    const unsubscribe = onSnapshot(collection(db, 'guests'), (snapshot) => {
      const guestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGuests(guestsData);
    });

    return () => unsubscribe();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalData = { ...formData };
    
    // Convertir el monto a número
    finalData.amountPaid = Number(finalData.amountPaid) || 0;

    if (finalData.attendance === 'ceremonia') {
      finalData.menu = 'no_aplica';
      finalData.amountPaid = 0;
    }

    try {
      await addDoc(collection(db, 'guests'), finalData);
      setFormData({ name: '', attendance: 'fiesta', menu: 'adulto', amountPaid: '' });
    } catch (error) {
      console.error("Error al registrar invitado: ", error);
      alert("Hubo un inconveniente al guardar el invitado.");
    }
  };

  const startEditing = (guest) => {
    setEditingId(guest.id);
    
    // Asegurar que editData tenga amountPaid poblado para compatibilidad hacia atrás
    const safeGuestData = { 
      ...guest, 
      amountPaid: getAmountPaid(guest) 
    };
    setEditData(safeGuestData);
  };

  const saveEdit = async () => {
    try {
      const guestRef = doc(db, 'guests', editingId);
      const { id, ...dataToSave } = editData;
      
      dataToSave.amountPaid = Number(dataToSave.amountPaid) || 0;

      if (dataToSave.attendance === 'ceremonia') {
        dataToSave.menu = 'no_aplica';
        dataToSave.amountPaid = 0;
      } else {
        if (dataToSave.menu === 'no_aplica') dataToSave.menu = 'adulto';
      }

      await updateDoc(guestRef, dataToSave);
      setEditingId(null);
    } catch (error) {
      console.error("Error al actualizar: ", error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas retirar a este invitado de la lista?')) {
      try {
        await deleteDoc(doc(db, 'guests', id));
      } catch (error) {
        console.error("Error al retirar: ", error);
      }
    }
  };

  const getMenuLabel = (menuValue) => {
    if (menuValue === 'adulto') return 'Adulto ($65.000)';
    if (menuValue === 'celiaco') return 'Adulto Celíaco ($65.000)';
    if (menuValue === 'kids') return 'Infantil ($45.000)';
    return '-';
  };

  return (
    <div className="app-container">
      <Dashboard guests={guests} />

      <section className="premium-panel">
        <h2>Sumar a la Celebración</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="input-group">
              <label>Nombre del Invitado</label>
              <input 
                type="text" 
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej. Familia Pérez"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Presencia</label>
              <select name="attendance" value={formData.attendance} onChange={handleInputChange}>
                <option value="fiesta">Ceremonia y Fiesta</option>
                <option value="ceremonia">Solo Ceremonia</option>
              </select>
            </div>

            {formData.attendance === 'fiesta' && (
              <>
                <div className="input-group">
                  <label>Menú</label>
                  <select name="menu" value={formData.menu} onChange={handleInputChange}>
                    <option value="adulto">Adulto ($65.000)</option>
                    <option value="celiaco">Adulto Celíaco ($65.000)</option>
                    <option value="kids">Infantil ($45.000)</option>
                  </select>
                </div>

                <div className="input-group">
                  <label>Transferido (ARS)</label>
                  <input 
                    type="number" 
                    name="amountPaid"
                    value={formData.amountPaid}
                    onChange={handleInputChange}
                    placeholder="Ej. 30000"
                    min="0"
                  />
                </div>
              </>
            )}
          </div>
          
          <button type="submit" className="btn-primary">Registrar Invitado</button>
        </form>
      </section>

      <section className="premium-panel">
        <h2>Nuestra Lista</h2>
        {guests.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>El inicio de una gran fiesta. Añade a tu primer invitado.</p>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Presencia</th>
                  <th>Menú</th>
                  <th>Progreso de Pago</th>
                  <th>Ajustes</th>
                </tr>
              </thead>
              <tbody>
                {guests.map((guest) => {
                  const cost = calculateCost(guest.menu, guest.attendance);
                  const paid = getAmountPaid(guest);
                  const isReady = paid >= cost && guest.attendance === 'fiesta';
                  
                  return (
                  <tr key={guest.id}>
                    {editingId === guest.id ? (
                      <>
                        <td>
                          <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="inline-input" />
                        </td>
                        <td>
                          <select name="attendance" value={editData.attendance} onChange={handleEditChange} className="inline-select">
                            <option value="fiesta">Ceremonia + Fiesta</option>
                            <option value="ceremonia">Solo Ceremonia</option>
                          </select>
                        </td>
                        
                        {editData.attendance === 'fiesta' ? (
                          <>
                            <td>
                              <select name="menu" value={editData.menu === 'no_aplica' ? 'adulto' : editData.menu} onChange={handleEditChange} className="inline-select">
                                <option value="adulto">Adulto</option>
                                <option value="celiaco">Adulto Celíaco</option>
                                <option value="kids">Infantil</option>
                              </select>
                            </td>
                            <td>
                              <input 
                                type="number" 
                                name="amountPaid" 
                                value={editData.amountPaid} 
                                onChange={handleEditChange} 
                                className="inline-input" 
                                placeholder="ARS" 
                                min="0"
                              />
                            </td>
                          </>
                        ) : (
                          <>
                            <td><span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>-</span></td>
                            <td><span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>-</span></td>
                          </>
                        )}
                        
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action btn-save" onClick={saveEdit}>Listo</button>
                            <button className="btn-action btn-delete" onClick={cancelEdit}>Volver</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="guest-name">{guest.name}</td>
                        <td>
                          <div className="status-indicator">
                            <span className={`dot ${guest.attendance === 'ceremonia' ? 'gray' : 'gold'}`}></span>
                            {guest.attendance === 'ceremonia' ? 'Ceremonia' : 'Completa'}
                          </div>
                        </td>
                        <td>
                          {guest.attendance === 'fiesta' ? (
                            <div className="status-indicator">
                              {getMenuLabel(guest.menu)}
                            </div>
                          ) : (
                            <span style={{color: '#a1a1a1', fontSize: '0.9rem'}}>-</span>
                          )}
                        </td>
                        <td>
                          {guest.attendance === 'fiesta' ? (
                            <div className="status-indicator">
                              <span className={`dot ${isReady ? 'green' : 'red'}`}></span>
                              {isReady ? 'Lugar Listo' : `$${paid.toLocaleString('es-AR')} de $${cost.toLocaleString('es-AR')}`}
                            </div>
                          ) : (
                            <span style={{color: '#a1a1a1', fontSize: '0.9rem'}}>-</span>
                          )}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="btn-action btn-edit" onClick={() => startEditing(guest)}>Ajustar</button>
                            <button className="btn-action btn-delete" onClick={() => handleDelete(guest.id)}>Retirar</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

export default App
