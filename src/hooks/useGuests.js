import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { getGuestPayments, sumPayments } from '../utils/finance';
import { newId } from '../utils/format';

// Campos que NO se escriben desde la edición general: los pagos se gestionan
// solo con addPayment/updatePayment/deletePayment para no pisar el historial.
const PROTECTED_FIELDS = ['id', 'payments', 'amountPaid'];

export function useGuests() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'guests'),
      (snapshot) => {
        const guestsData = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setGuests(guestsData);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error al sincronizar invitados: ", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addGuest = async (newGuest) => {
    try {
      await addDoc(collection(db, 'guests'), newGuest);
    } catch (error) {
      console.error("Error al registrar invitado: ", error);
      throw error;
    }
  };

  const updateGuest = async (id, updatedData) => {
    try {
      const data = { ...updatedData };
      PROTECTED_FIELDS.forEach((field) => delete data[field]);
      const guestRef = doc(db, 'guests', id);
      await updateDoc(guestRef, data);
    } catch (error) {
      console.error("Error al actualizar invitado: ", error);
      throw error;
    }
  };

  const deleteGuest = async (id) => {
    try {
      await deleteDoc(doc(db, 'guests', id));
    } catch (error) {
      console.error("Error al eliminar invitado: ", error);
      throw error;
    }
  };

  // Lee el documento actual dentro de una transacción, aplica el cambio al
  // historial y guarda payments + amountPaid (total, para compatibilidad).
  // Si el invitado no tenía historial, su monto previo se conserva como primer pago.
  const changePayments = async (guestId, settings, change) => {
    try {
      const guestRef = doc(db, 'guests', guestId);
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(guestRef);
        if (!snap.exists()) throw new Error('El invitado ya no existe.');
        const current = getGuestPayments(snap.data(), settings).map((p) => {
          if (!p.legacy) return p;
          return { id: newId(), amount: p.amount, date: '', method: '', note: p.note, legacy: true };
        });
        const payments = change(current);
        tx.update(guestRef, { payments, amountPaid: sumPayments(payments) });
      });
    } catch (error) {
      console.error("Error al registrar pago: ", error);
      throw error;
    }
  };

  const cleanPayment = (p) => ({
    amount: Math.max(0, Number(p.amount) || 0),
    date: p.date || '',
    method: p.method || '',
    note: (p.note || '').trim(),
  });

  const addPayment = (guestId, payment, settings) =>
    changePayments(guestId, settings, (list) => [...list, { id: newId(), ...cleanPayment(payment) }]);

  const updatePayment = (guestId, paymentId, payment, settings) =>
    changePayments(guestId, settings, (list) =>
      list.map((p) => (p.id === paymentId || (p.legacy && paymentId === 'legacy') ? { ...p, ...cleanPayment(payment) } : p)));

  const deletePayment = (guestId, paymentId, settings) =>
    changePayments(guestId, settings, (list) =>
      list.filter((p) => !(p.id === paymentId || (p.legacy && paymentId === 'legacy'))));

  return { guests, loading, error, addGuest, updateGuest, deleteGuest, addPayment, updatePayment, deletePayment };
}
