import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export function useGuests() {
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'guests'), (snapshot) => {
      const guestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGuests(guestsData);
    });

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
      const guestRef = doc(db, 'guests', id);
      await updateDoc(guestRef, updatedData);
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

  return { guests, addGuest, updateGuest, deleteGuest };
}
