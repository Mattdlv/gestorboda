import React, { useState } from 'react';
import PaymentStatusBadge from './finance/PaymentStatusBadge';
import PaymentProgress from './finance/PaymentProgress';
import { getGuestFinance } from '../utils/finance';
import { formatARS } from '../utils/format';

// Campos que se editan desde "Ajustar". Los pagos se gestionan desde "Pagos".
const EDITABLE_FIELDS = ['name', 'grupo', 'attendance', 'menu', 'mesa'];

export default function GuestRow({ guest, settings, onUpdate, onDelete, onOpenPayments }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const remoteMesa = guest.mesa || 'Sin asignar';
  const [localMesa, setLocalMesa] = useState(remoteMesa);
  const [syncedMesa, setSyncedMesa] = useState(remoteMesa);

  // Si la mesa cambia en la base (otro dispositivo, refresh), actualizar el input
  if (remoteMesa !== syncedMesa) {
    setSyncedMesa(remoteMesa);
    setLocalMesa(remoteMesa);
  }

  const notifyError = () => alert('No se pudo guardar el cambio. Revisá la conexión e intentá de nuevo.');

  const finance = getGuestFinance(guest, settings);

  const startEditing = () => {
    setIsEditing(true);
    setEditData({
      name: guest.name || '',
      attendance: guest.attendance === 'ceremonia' ? 'ceremonia' : 'fiesta',
      menu: guest.menu === 'no_aplica' || !guest.menu ? 'adulto' : guest.menu,
      grupo: guest.grupo || 'Familia',
      mesa: guest.mesa || 'Sin asignar'
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const saveEdit = () => {
    if (!editData.name.trim()) return;
    const dataToSave = Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, editData[f]]));
    dataToSave.name = dataToSave.name.trim();

    if (!dataToSave.mesa.trim()) dataToSave.mesa = 'Sin asignar';

    if (dataToSave.attendance === 'ceremonia') {
      dataToSave.menu = 'no_aplica';
      // Los pagos se conservan: no se borra historial al pasar a ceremonia
      if (finance.paid > 0 && guest.attendance !== 'ceremonia' && !window.confirm(
        `${guest.name} tiene ${formatARS(finance.paid)} registrados. Al pasar a "Solo ceremonia" no tendrá menú, pero los pagos se conservan para que puedan revisarlos. ¿Continuar?`
      )) return;
    } else if (dataToSave.menu === 'no_aplica') {
      dataToSave.menu = 'adulto';
    }

    onUpdate(guest.id, dataToSave).catch(notifyError);
    setLocalMesa(dataToSave.mesa);
    setIsEditing(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    const extra = finance.paid > 0 ? `\nTiene ${formatARS(finance.paid)} en pagos registrados que también se eliminarán.` : '';
    if (window.confirm(`¿Deseas retirar a ${guest.name} de la lista?${extra}`)) {
      onDelete(guest.id).catch(notifyError);
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
      onUpdate(guest.id, { mesa: finalMesa }).catch(() => {
        setLocalMesa(remoteMesa);
        notifyError();
      });
    }
  };

  const getMenuLabel = () => {
    if (finance.needsMenuReview) return 'Revisar menú';
    if (guest.menu === 'celiaco') return 'Adulto Celíaco';
    if (finance.category === 'kids') return 'Kids';
    return 'Adulto';
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
      <tr className="guest-row is-editing">
        <td data-label="Nombre y Grupo">
          <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="inline-input" style={{marginBottom: '5px'}} aria-label="Nombre"/>
          <select name="grupo" value={editData.grupo} onChange={handleEditChange} className="inline-select" aria-label="Grupo">
            <option value="Familia">Familia</option>
            <option value="Amigos">Amigos</option>
            <option value="Trabajo">Trabajo</option>
            <option value="Otros">Otros</option>
          </select>
        </td>
        <td data-label="Presencia">
          <select name="attendance" value={editData.attendance} onChange={handleEditChange} className="inline-select" aria-label="Presencia">
            <option value="fiesta">Ceremonia + Fiesta</option>
            <option value="ceremonia">Solo Ceremonia</option>
          </select>
        </td>
        <td data-label="Menú">
          {editData.attendance === 'fiesta' ? (
            <select name="menu" value={editData.menu} onChange={handleEditChange} className="inline-select" aria-label="Menú">
              <option value="adulto">Adulto</option>
              <option value="celiaco">Adulto Celíaco</option>
              <option value="kids">Kids</option>
            </select>
          ) : (
            <span style={{color: 'var(--text-muted)', fontSize: '0.9rem'}}>-</span>
          )}
        </td>
        <td data-label="Pagos">
          <span style={{color: 'var(--text-muted)', fontSize: '0.85rem'}}>Se registran desde "Pagos"</span>
        </td>
        <td data-label="Mesa">
          <input
            type="text"
            name="mesa"
            value={editData.mesa}
            onChange={handleEditChange}
            className="inline-input"
            placeholder="Mesa"
            aria-label="Mesa"
          />
        </td>
        <td data-label="">
          <div className="action-buttons">
            <button className="btn-action btn-save" onClick={saveEdit}>Listo</button>
            <button className="btn-action btn-delete" onClick={cancelEdit}>Volver</button>
          </div>
        </td>
      </tr>
    );
  }

  // Lectura mode
  const grupo = guest.grupo || 'Otros';
  const tone = finance.status === 'pagado' ? 'ok' : 'warn';

  return (
    <tr className="guest-row">
      <td data-label="Nombre y Grupo">
        <div className="guest-name">{guest.name}</div>
        <div style={getGroupBadgeStyle(grupo)}>{grupo}</div>
      </td>
      <td data-label="Presencia">
        <div className="status-indicator">
          <span className={`dot ${guest.attendance === 'ceremonia' ? 'gray' : 'gold'}`}></span>
          {guest.attendance === 'ceremonia' ? 'Ceremonia' : 'Completa'}
        </div>
      </td>
      <td data-label="Menú">
        {guest.attendance === 'fiesta' ? (
          <div className="status-indicator">
            {getMenuLabel()}
          </div>
        ) : (
          <span style={{color: '#a1a1a1', fontSize: '0.9rem'}}>-</span>
        )}
      </td>
      <td data-label="Pagos" className="guest-row-payments">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minWidth: '190px' }}>
          <PaymentStatusBadge status={finance.status} />
          {finance.price > 0 && (
            <>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                {formatARS(finance.paid)} de {formatARS(finance.price)}
                {finance.remaining > 0 && <> · falta {formatARS(finance.remaining)}</>}
              </span>
              <PaymentProgress progress={finance.progress} tone={tone} />
            </>
          )}
          {finance.price === 0 && finance.paid > 0 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatARS(finance.paid)} registrados</span>
          )}
        </div>
      </td>
      <td data-label="Mesa">
        <input
          type="text"
          value={localMesa}
          onChange={handleLocalMesaChange}
          onBlur={handleQuickMesaBlur}
          className="inline-input"
          style={{ width: '80px', textAlign: 'center' }}
          title="Editar mesa rápidamente"
          aria-label={`Mesa de ${guest.name}`}
        />
      </td>
      <td data-label="">
        <div className="action-buttons">
          <button className="btn-action btn-save" onClick={() => onOpenPayments(guest.id)}>Pagos</button>
          <button className="btn-action btn-edit" onClick={startEditing}>Ajustar</button>
          <button className="btn-action btn-delete" onClick={handleDelete}>Retirar</button>
        </div>
      </td>
    </tr>
  );
}
