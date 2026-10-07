// Modelo financiero del casamiento.
// - "price" = lo que paga el invitado (precio de venta)
// - "cost"  = lo que nos cobra el catering (costo real)
// - "margin" = price - cost (nunca se carga a mano)
// Todo se deriva de los invitados existentes; no hay datos financieros duplicados.

import { toNumber, todayISO, daysBetween } from './format.js';

export const DEFAULT_FINANCE_SETTINGS = {
  menus: {
    adulto: { cost: 56300, price: 65000 },
    kids: { cost: 36200, price: 45000 },
  },
};

export const MENU_CATEGORIES = {
  adulto: 'Adulto',
  kids: 'Kids',
};

export const PAYMENT_METHODS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta', label: 'Tarjeta' },
  { value: 'otro', label: 'Otro' },
];

export const PAYMENT_STATUS = {
  sin_pago: { label: 'Sin pago', tone: 'warn', icon: '○' },
  parcial: { label: 'Pago parcial', tone: 'warn', icon: '◐' },
  pagado: { label: 'Pagado', tone: 'ok', icon: '●' },
  no_corresponde: { label: 'No corresponde', tone: 'info', icon: '—' },
};

export const LEGACY_PAYMENT_ID = 'legacy';

// Normaliza la configuración (por si en Firebase falta algún campo)
export const normalizeSettings = (raw) => {
  const menus = {};
  for (const key of Object.keys(DEFAULT_FINANCE_SETTINGS.menus)) {
    const def = DEFAULT_FINANCE_SETTINGS.menus[key];
    const src = raw?.menus?.[key] || {};
    const cost = toNumber(src.cost);
    const price = toNumber(src.price);
    menus[key] = {
      cost: cost > 0 ? cost : def.cost,
      price: price > 0 ? price : def.price,
    };
  }
  return { menus };
};

export const isParty = (guest) => guest?.attendance === 'fiesta';

// Categoría financiera del menú. El menú celíaco es un menú Adulto.
// Devuelve null si no corresponde menú (ceremonia) o si el dato es inválido.
export const getMenuCategory = (guest) => {
  if (!isParty(guest)) return null;
  if (guest.menu === 'adulto' || guest.menu === 'celiaco') return 'adulto';
  if (guest.menu === 'kids') return 'kids';
  return null;
};

// Pagos del invitado. Si todavía no tiene historial, el monto heredado
// (amountPaid o payment === 'abonado') se presenta como un pago "anterior".
export const getGuestPayments = (guest, settings = DEFAULT_FINANCE_SETTINGS) => {
  if (Array.isArray(guest?.payments)) {
    return guest.payments
      .filter((p) => p && toNumber(p.amount) > 0)
      .map((p) => ({ ...p, amount: toNumber(p.amount) }));
  }

  let legacyAmount = 0;
  if (guest?.amountPaid !== undefined && guest?.amountPaid !== null && guest?.amountPaid !== '') {
    legacyAmount = toNumber(guest.amountPaid);
  } else if (guest?.payment === 'abonado') {
    const category = getMenuCategory(guest);
    legacyAmount = category ? normalizeSettings(settings).menus[category].price : 0;
  }

  if (legacyAmount <= 0) return [];
  return [{
    id: LEGACY_PAYMENT_ID,
    amount: legacyAmount,
    date: '',
    method: '',
    note: 'Pago registrado antes del historial',
    legacy: true,
  }];
};

export const sumPayments = (payments) =>
  payments.reduce((acc, p) => acc + Math.max(0, toNumber(p.amount)), 0);

export const getPaymentStatus = (price, paid) => {
  if (price <= 0) return 'no_corresponde';
  if (paid <= 0) return 'sin_pago';
  if (paid >= price) return 'pagado';
  return 'parcial';
};

// Ficha financiera completa de un invitado
export const getGuestFinance = (guest, settings = DEFAULT_FINANCE_SETTINGS) => {
  const s = normalizeSettings(settings);
  const category = getMenuCategory(guest);
  const price = category ? s.menus[category].price : 0;
  const cost = category ? s.menus[category].cost : 0;
  const payments = getGuestPayments(guest, s);
  const paid = sumPayments(payments);
  const remaining = Math.max(0, price - paid);
  const overpaid = Math.max(0, paid - price);
  const progress = price > 0 ? Math.min(1, paid / price) : null;
  const lastPaymentDate = payments
    .map((p) => p.date || '')
    .filter(Boolean)
    .sort()
    .pop() || '';

  return {
    category,
    price,
    cost,
    margin: price - cost,
    paid,
    remaining,
    overpaid,
    progress,
    status: getPaymentStatus(price, paid),
    payments,
    lastPaymentDate,
    // Invitado de fiesta con un menú que no reconocemos: hay que revisarlo
    needsMenuReview: isParty(guest) && !category,
    // Ya pagó la parte de margen de su menú (pagos que superan el costo del catering)
    securedMargin: price > 0 ? Math.max(0, Math.min(paid, price) - cost) : 0,
  };
};

// Simula el resultado de agregar un pago (para la vista previa del modal)
export const previewPayment = (finance, amount) => {
  const paid = finance.paid + Math.max(0, toNumber(amount));
  return {
    paid,
    remaining: Math.max(0, finance.price - paid),
    overpaid: Math.max(0, paid - finance.price),
    status: getPaymentStatus(finance.price, paid),
  };
};

// Totales globales derivados de los invitados
export const computeTotals = (guests, settings = DEFAULT_FINANCE_SETTINGS) => {
  const s = normalizeSettings(settings);
  const byMenu = {
    adulto: { count: 0, price: 0, cost: 0, margin: 0, paid: 0 },
    kids: { count: 0, price: 0, cost: 0, margin: 0, paid: 0 },
  };
  const totals = {
    guests: guests.length,
    party: 0,
    ceremony: 0,
    adults: 0,
    kids: 0,
    celiac: 0,
    expected: 0,
    collected: 0, // todo lo cobrado (incluye excedentes)
    collectedTowardsExpected: 0, // cobrado sin contar excedentes (para el progreso)
    pending: 0,
    cateringCost: 0,
    expectedMargin: 0,
    securedMargin: 0,
    overpaid: 0,
    statusCount: { sin_pago: 0, parcial: 0, pagado: 0, no_corresponde: 0 },
    needsMenuReview: 0,
    byMenu,
  };

  for (const guest of guests) {
    const f = getGuestFinance(guest, s);
    if (isParty(guest)) totals.party++;
    else totals.ceremony++;
    if (guest.menu === 'celiaco' && f.category) totals.celiac++;
    if (f.needsMenuReview) totals.needsMenuReview++;

    totals.statusCount[f.status]++;
    totals.collected += f.paid;
    totals.overpaid += f.overpaid;

    if (!f.category) continue;
    if (f.category === 'adulto') totals.adults++;
    else totals.kids++;

    const m = byMenu[f.category];
    m.count++;
    m.price += f.price;
    m.cost += f.cost;
    m.margin += f.margin;
    m.paid += Math.min(f.paid, f.price);

    totals.expected += f.price;
    totals.cateringCost += f.cost;
    totals.expectedMargin += f.margin;
    totals.collectedTowardsExpected += Math.min(f.paid, f.price);
    totals.pending += f.remaining;
    totals.securedMargin += f.securedMargin;
  }

  totals.menus = totals.adults + totals.kids;
  totals.progress = totals.expected > 0 ? totals.collectedTowardsExpected / totals.expected : 0;
  return totals;
};

// ---------- Gastos / proveedores ----------

export const EXPENSE_CATEGORIES = [
  { value: 'catering', label: 'Catering' },
  { value: 'salon', label: 'Salón' },
  { value: 'fotografia', label: 'Fotografía' },
  { value: 'musica', label: 'Música' },
  { value: 'decoracion', label: 'Decoración' },
  { value: 'vestido', label: 'Vestido' },
  { value: 'traje', label: 'Traje' },
  { value: 'invitaciones', label: 'Invitaciones' },
  { value: 'otros', label: 'Otros' },
];

export const getExpenseCategoryLabel = (value) =>
  EXPENSE_CATEGORIES.find((c) => c.value === value)?.label || 'Otros';

export const UPCOMING_DAYS = 14;

// Resumen de gastos. Los pagos al catering se separan de los "otros gastos".
export const computeExpenses = (expenses, today = todayISO()) => {
  const summary = {
    cateringPaid: 0,
    cateringScheduled: 0,
    otherPaid: 0,
    otherScheduled: 0,
    overdue: [],
    upcoming: [],
    nextPayment: null,
  };

  for (const e of expenses) {
    const amount = Math.max(0, toNumber(e.amount));
    const isCatering = e.category === 'catering';
    const isPaid = e.status === 'pagado';

    if (isCatering) {
      if (isPaid) summary.cateringPaid += amount;
      else summary.cateringScheduled += amount;
    } else if (isPaid) summary.otherPaid += amount;
    else summary.otherScheduled += amount;

    if (!isPaid && e.date) {
      const days = daysBetween(today, e.date);
      if (days < 0) summary.overdue.push(e);
      else if (days <= UPCOMING_DAYS) summary.upcoming.push(e);
    }
  }

  const byDate = (a, b) => (a.date || '').localeCompare(b.date || '');
  summary.overdue.sort(byDate);
  summary.upcoming.sort(byDate);
  summary.nextPayment = expenses
    .filter((e) => e.status !== 'pagado' && e.date && daysBetween(today, e.date) >= 0)
    .sort(byDate)[0] || null;
  return summary;
};

// Estado de tranquilidad: rojo solo si hay vencimientos reales atrasados.
// Que un invitado todavía no haya pagado NO es un problema (no tiene vencimiento).
export const getPeaceOfMind = (expenseSummary) => {
  if (expenseSummary.overdue.length > 0) {
    return { level: 'alert', icon: '🔴', title: 'Hay pagos atrasados', detail: 'Conviene revisarlos con calma cuando puedan.' };
  }
  if (expenseSummary.upcoming.length > 0) {
    return { level: 'warn', icon: '🟡', title: 'Hay pagos próximos', detail: `En los próximos ${UPCOMING_DAYS} días.` };
  }
  return { level: 'ok', icon: '🟢', title: 'Todo bajo control', detail: 'No hay pagos atrasados ni vencimientos cercanos.' };
};

// Texto corto de asistencia + menú, p. ej. "Fiesta · Adulto"
export const getAttendanceLabel = (guest, finance) => {
  if (!isParty(guest)) return 'Solo ceremonia';
  if (finance.needsMenuReview) return 'Fiesta · Revisar menú';
  if (guest.menu === 'celiaco') return 'Fiesta · Adulto (celíaco)';
  return finance.category === 'kids' ? 'Fiesta · Kids' : 'Fiesta · Adulto';
};
