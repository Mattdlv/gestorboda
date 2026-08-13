export const MENU_PRICES = {
  adulto: 65000,
  celiaco: 65000,
  kids: 45000,
  no_aplica: 0,
};

export const calculateCost = (menu, attendance) => {
  if (attendance === 'ceremonia' || menu === 'no_aplica') return 0;
  return MENU_PRICES[menu] || 0;
};

// Función para compatibilidad hacia atrás
export const getAmountPaid = (guest) => {
  if (guest.amountPaid !== undefined) return Number(guest.amountPaid);
  
  // Si no tiene amountPaid, calcular basado en el viejo sistema
  const cost = calculateCost(guest.menu, guest.attendance);
  if (guest.payment === 'abonado') return cost;
  return 0; // 'pendiente' o cualquier otra cosa
};
