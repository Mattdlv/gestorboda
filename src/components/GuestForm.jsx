import React, { useState } from 'react';
import { formatARS, todayISO, newId } from '../utils/format';

export default function GuestForm({ onSubmit, settings, formRef }) {
  const prices = settings.menus;
  const [formData, setFormData] = useState({
    name: '',
    attendance: 'fiesta', 
    menu: 'adulto',
    amountPaid: '',
    grupo: 'Familia',
    mesa: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalData = { ...formData };
    
    // Convertir el monto a número (nunca negativo)
    finalData.amountPaid = Math.max(0, Number(finalData.amountPaid) || 0);

    // Si la mesa está vacía, la guardamos como "Sin asignar"
    if (!finalData.mesa.trim()) {
      finalData.mesa = 'Sin asignar';
    }

    if (finalData.attendance === 'ceremonia') {
      finalData.menu = 'no_aplica';
      finalData.amountPaid = 0;
    }

    // El monto inicial queda como primer pago del historial
    finalData.payments = finalData.amountPaid > 0
      ? [{ id: newId(), amount: finalData.amountPaid, date: todayISO(), method: 'transferencia', note: 'Pago inicial' }]
      : [];

    try {
      await onSubmit(finalData);
    } catch {
      alert('Hubo un inconveniente al guardar el invitado. Intentá de nuevo.');
      return;
    }
    setFormData({ 
      name: '', 
      attendance: 'fiesta', 
      menu: 'adulto', 
      amountPaid: '',
      grupo: 'Familia',
      mesa: ''
    });
  };

  return (
    <section className="premium-panel" ref={formRef}>
      <h2>Sumar a la Celebración</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="input-group">
            <label htmlFor="nameInput">Nombre del Invitado</label>
            <input 
              id="nameInput"
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ej. Familia Pérez"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="attendanceSelect">Presencia</label>
            <select id="attendanceSelect" name="attendance" value={formData.attendance} onChange={handleInputChange}>
              <option value="fiesta">Ceremonia y Fiesta</option>
              <option value="ceremonia">Solo Ceremonia</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="grupoSelect">Grupo</label>
            <select id="grupoSelect" name="grupo" value={formData.grupo} onChange={handleInputChange}>
              <option value="Familia">Familia</option>
              <option value="Amigos">Amigos</option>
              <option value="Trabajo">Trabajo</option>
              <option value="Otros">Otros</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="mesaInput">Mesa (Opcional)</label>
            <input 
              id="mesaInput"
              type="text" 
              name="mesa"
              value={formData.mesa}
              onChange={handleInputChange}
              placeholder="Ej. 5"
            />
          </div>

          {formData.attendance === 'fiesta' && (
            <>
              <div className="input-group">
                <label htmlFor="menuSelect">Menú</label>
                <select id="menuSelect" name="menu" value={formData.menu} onChange={handleInputChange}>
                  <option value="adulto">Adulto ({formatARS(prices.adulto.price)})</option>
                  <option value="celiaco">Adulto Celíaco ({formatARS(prices.adulto.price)})</option>
                  <option value="kids">Kids ({formatARS(prices.kids.price)})</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="amountPaidInput">Pago inicial (opcional)</label>
                <input
                  id="amountPaidInput"
                  type="number"
                  inputMode="numeric"
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
  );
}
