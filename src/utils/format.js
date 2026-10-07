// Formateo centralizado de moneda (ARS) y fechas (formato argentino).
// Las fechas se guardan como 'YYYY-MM-DD' (sin hora) para evitar problemas de timezone.

const arsFormatter = new Intl.NumberFormat('es-AR', {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

export const formatARS = (value) => {
  const n = Math.round(toNumber(value));
  const formatted = arsFormatter.format(Math.abs(n));
  return n < 0 ? `-$${formatted}` : `$${formatted}`;
};

const pad = (n) => String(n).padStart(2, '0');

// Fecha de hoy en hora local como 'YYYY-MM-DD'
export const todayISO = (now = new Date()) =>
  `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

const isISODate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

// '2026-10-06' -> '06/10/2026'
export const formatDate = (iso) => {
  if (!isISODate(iso)) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// '2026-10-15' -> '15 de octubre'
export const formatDateLong = (iso) => {
  if (!isISODate(iso)) return '';
  const [, m, d] = iso.split('-');
  return `${Number(d)} de ${MONTHS[Number(m) - 1]}`;
};

// Diferencia en días entre dos fechas ISO (b - a), sin depender de la zona horaria
export const daysBetween = (a, b) => {
  if (!isISODate(a) || !isISODate(b)) return 0;
  const toUTC = (iso) => {
    const [y, m, d] = iso.split('-').map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
};

export const newId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
