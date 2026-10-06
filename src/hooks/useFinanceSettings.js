import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { DEFAULT_FINANCE_SETTINGS, normalizeSettings } from '../utils/finance';

// Configuración financiera en settings/finance.
// Si el documento no existe (o no se puede leer), se usan los valores por defecto.
export function useFinanceSettings() {
  const [settings, setSettings] = useState(DEFAULT_FINANCE_SETTINGS);
  const [isDefault, setIsDefault] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'finance'),
      (snap) => {
        setSettings(normalizeSettings(snap.exists() ? snap.data() : null));
        setIsDefault(!snap.exists());
        setError(null);
      },
      (err) => {
        console.error("Error al leer configuración financiera: ", err);
        setError(err);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveSettings = async (next) => {
    try {
      await setDoc(doc(db, 'settings', 'finance'), normalizeSettings(next), { merge: true });
    } catch (err) {
      console.error("Error al guardar configuración financiera: ", err);
      throw err;
    }
  };

  return { settings, isDefault, error, saveSettings };
}
