import React, { useState } from 'react';
import { MENU_PRICES } from '../utils/constants';

export default function GuestForm({ onSubmit }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const finalData = { ...formData };
    
    // Convertir el monto a número
    finalData.amountPaid = Number(finalData.amountPaid) || 0;
    
    // Si la mesa está vacía, la guardamos como "Sin asignar"
    if (!finalData.mesa.trim()) {
      finalData.mesa = 'Sin asignar';
    }

    if (finalData.attendance === 'ceremonia') {
      finalData.menu = 'no_aplica';
      finalData.amountPaid = 0;
    }

    onSubmit(finalData);
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
    <section className="premium-panel">
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
                  <option value="adulto">Adulto (${MENU_PRICES.adulto.toLocaleString('es-AR')})</option>
                  <option value="celiaco">Adulto Celíaco (${MENU_PRICES.celiaco.toLocaleString('es-AR')})</option>
                  <option value="kids">Infantil (${MENU_PRICES.kids.toLocaleString('es-AR')})</option>
                </select>
              </div>

              <div className="input-group">
                <label htmlFor="amountPaidInput">Transferido (ARS)</label>
                <input 
                  id="amountPaidInput"
                  type="number" 
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  placeholder={`Ej. ${MENU_PRICES.adulto / 2}`}
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
