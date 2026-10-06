import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

// Gastos a proveedores (colección "expenses"), separados de los invitados.
export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'expenses'),
      (snapshot) => {
        setExpenses(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
        setError(null);
      },
      (err) => {
        console.error("Error al leer gastos: ", err);
        setError(err);
      }
    );
    return () => unsubscribe();
  }, []);

  const clean = (e) => ({
    name: (e.name || '').trim(),
    category: e.category || 'otros',
    amount: Math.max(0, Number(e.amount) || 0),
    date: e.date || '',
    status: e.status === 'pagado' ? 'pagado' : 'pendiente',
    note: (e.note || '').trim(),
  });

  const addExpense = async (expense) => {
    try {
      await addDoc(collection(db, 'expenses'), clean(expense));
    } catch (err) {
      console.error("Error al registrar gasto: ", err);
      throw err;
    }
  };

  const updateExpense = async (id, expense) => {
    try {
      await updateDoc(doc(db, 'expenses', id), clean(expense));
    } catch (err) {
      console.error("Error al actualizar gasto: ", err);
      throw err;
    }
  };

  const deleteExpense = async (id) => {
    try {
      await deleteDoc(doc(db, 'expenses', id));
    } catch (err) {
      console.error("Error al eliminar gasto: ", err);
      throw err;
    }
  };

  return { expenses, error, addExpense, updateExpense, deleteExpense };
}
