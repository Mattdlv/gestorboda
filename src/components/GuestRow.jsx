import React, { useState } from 'react';
import { calculateCost, getAmountPaid, MENU_PRICES } from '../utils/constants';

export default function GuestRow({ guest, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [localMesa, setLocalMesa] = useState(guest.mesa || 'Sin asignar');

  const startEditing = () => {
    setIsEditing(true);
    setEditData({ 
      ...guest, 
      amountPaid: getAmountPaid(guest),
      grupo: guest.grupo || 'Familia',
      mesa: guest.mesa || 'Sin asignar'
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = () => {
    const dataToSave = { ...editData };
    dataToSave.amountPaid = Number(dataToSave.amountPaid) || 0;

    if (!dataToSave.mesa.trim()) dataToSave.mesa = 'Sin asignar';

    if (dataToSave.attendance === 'ceremonia') {
      dataToSave.menu = 'no_aplica';
      dataToSave.amountPaid = 0;
    } else {
      if (dataToSave.menu === 'no_aplica') dataToSave.menu = 'adulto';
    }

    onUpdate(guest.id, dataToSave);
    setLocalMesa(dataToSave.mesa);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('¿Deseas retirar a este invitado de la lista?')) {
      onDelete(guest.id);
    }
  };

  // Quick edit for mesa
  const handleLocalMesaChange = (e) => {
    setLocalMesa(e.target.value);
  };
  const handleQuickMesaBlur = () => {
    const finalMesa = localMesa.trim() || 'Sin asignar';
    setLocalMesa(finalMesa);
    if (finalMesa !== (guest.mesa || 'Sin asignar')) {
      onUpdate(guest.id, { mesa: finalMesa });
    }
  };

  const getMenuLabel = (menuValue) => {
    if (menuValue === 'adulto') return `Adulto ($${MENU_PRICES.adulto.toLocaleString('es-AR')})`;
    if (menuValue === 'celiaco') return `Adulto Celíaco ($${MENU_PRICES.celiaco.toLocaleString('es-AR')})`;
    if (menuValue === 'kids') return `Infantil ($${MENU_PRICES.kids.toLocaleString('es-AR')})`;
    return '-';
  };

  const getGroupBadgeStyle = (grupo) => {
    const baseStyle = {
      padding: '4px 10px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: '700',
      textTransform: 'uppercase',
      display: 'inline-block',
      letterSpacing: '1px'
    };
    switch (grupo) {
      case 'Familia': return { ...baseStyle, backgroundColor: 'rgba(138, 154, 134, 0.15)', color: 'var(--accent-sage)' };
      case 'Amigos': return { ...baseStyle, backgroundColor: 'rgba(196, 154, 118, 0.15)', color: 'var(--accent-terracota)' };
      case 'Trabajo': return { ...baseStyle, backgroundColor: 'rgba(44, 53, 49, 0.1)', color: 'var(--text-main)' };
      default: return { ...baseStyle, backgroundColor: 'rgba(95, 103, 90, 0.1)', color: 'var(--text-muted)' };
    }
  };

  if (isEditing) {
    return (
      <tr>
        <td>
          <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="inline-input" style={{marginBottom: '5px'}}/>
          <select name="grupo" value={editData.grupo} onChange={handleEditChange} className="inline-select">
            <option value="Familia">Familia</option>
            <option value="Amigos">Amigos</option>
            <option value="Trabajo">Trabajo</option>
            <option value="Otros">Otros</option>
          </select>
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
          <input 
            type="text" 
            name="mesa" 
            value={editData.mesa} 
            onChange={handleEditChange} 
            className="inline-input" 
            placeholder="Mesa" 
          />
        </td>
        
        <td>
          <div className="action-buttons">
            <button className="btn-action btn-save" onClick={saveEdit}>Listo</button>
            <button className="btn-action btn-delete" onClick={cancelEdit}>Volver</button>
          </div>
        </td>
      </tr>
    );
  }

  // Lectura mode
  const cost = calculateCost(guest.menu, guest.attendance);
  const paid = getAmountPaid(guest);
  const isReady = paid >= cost && guest.attendance === 'fiesta';
  const grupo = guest.grupo || 'Otros';

  return (
    <tr>
      <td>
        <div className="guest-name">{guest.name}</div>
        <div style={getGroupBadgeStyle(grupo)}>{grupo}</div>
      </td>
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
        <input 
          type="text"
          value={localMesa}
          onChange={handleLocalMesaChange}
          onBlur={handleQuickMesaBlur}
          className="inline-input"
          style={{ width: '80px', textAlign: 'center' }}
          title="Editar mesa rápidamente"
        />
      </td>
      <td>
        <div className="action-buttons">
          <button className="btn-action btn-edit" onClick={startEditing}>Ajustar</button>
          <button className="btn-action btn-delete" onClick={handleDelete}>Retirar</button>
        </div>
      </td>
    </tr>
  );
}
