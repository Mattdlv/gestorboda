import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  getGuestFinance, computeTotals, previewPayment, computeExpenses, getPeaceOfMind,
  DEFAULT_FINANCE_SETTINGS,
} from './finance.js';
import { formatARS, formatDate } from './format.js';

const S = DEFAULT_FINANCE_SETTINGS;
const adult = (extra = {}) => ({ name: 'Juan', attendance: 'fiesta', menu: 'adulto', ...extra });
const kid = (extra = {}) => ({ name: 'Sofi', attendance: 'fiesta', menu: 'kids', ...extra });
const pay = (amount, date = '2026-10-06') => ({ id: `${amount}-${date}`, amount, date, method: 'transferencia', note: '' });

test('Caso 1: adulto sin pago', () => {
  const f = getGuestFinance(adult({ payments: [] }), S);
  assert.equal(f.price, 65000);
  assert.equal(f.paid, 0);
  assert.equal(f.remaining, 65000);
  assert.equal(f.margin, 8700);
  assert.equal(f.status, 'sin_pago');
});

test('Caso 2: adulto pagado completo', () => {
  const f = getGuestFinance(adult({ payments: [pay(65000)] }), S);
  assert.equal(f.paid, 65000);
  assert.equal(f.remaining, 0);
  assert.equal(f.status, 'pagado');
  assert.equal(f.progress, 1);
});

test('Caso 3: adulto pago parcial', () => {
  const f = getGuestFinance(adult({ payments: [pay(30000)] }), S);
  assert.equal(f.price, 65000);
  assert.equal(f.paid, 30000);
  assert.equal(f.remaining, 35000);
  assert.equal(f.status, 'parcial');
  assert.equal(Math.floor(f.progress * 100), 46);
});

test('Caso 4: kids', () => {
  const f = getGuestFinance(kid(), S);
  assert.equal(f.cost, 36200);
  assert.equal(f.price, 45000);
  assert.equal(f.margin, 8800);
});

test('Caso 5: ceremonia', () => {
  const f = getGuestFinance({ name: 'Ana', attendance: 'ceremonia', menu: 'no_aplica', amountPaid: 0 }, S);
  assert.equal(f.cost, 0);
  assert.equal(f.price, 0);
  assert.equal(f.remaining, 0);
  assert.equal(f.margin, 0);
  assert.equal(f.status, 'no_corresponde');
});

test('Caso 6: 50 adultos + 10 kids + ceremonia no cuenta', () => {
  const guests = [
    ...Array.from({ length: 50 }, () => adult()),
    ...Array.from({ length: 10 }, () => kid()),
    { attendance: 'ceremonia', menu: 'no_aplica' },
  ];
  const t = computeTotals(guests, S);
  assert.equal(t.expected, 3700000);
  assert.equal(t.cateringCost, 3177000);
  assert.equal(t.expectedMargin, 523000);
  assert.equal(t.menus, 60);
  assert.equal(t.ceremony, 1);
  assert.equal(t.pending, 3700000);
  assert.equal(t.byMenu.adulto.price, 3250000);
  assert.equal(t.byMenu.adulto.cost, 2815000);
  assert.equal(t.byMenu.adulto.margin, 435000);
  assert.equal(t.byMenu.kids.price, 450000);
  assert.equal(t.byMenu.kids.cost, 362000);
  assert.equal(t.byMenu.kids.margin, 88000);
});

test('Caso 7: pagos múltiples 30.000 + 35.000 = pagado', () => {
  const f = getGuestFinance(adult({ payments: [pay(30000), pay(35000, '2026-11-06')] }), S);
  assert.equal(f.paid, 65000);
  assert.equal(f.status, 'pagado');
  assert.equal(f.lastPaymentDate, '2026-11-06');
});

test('Compatibilidad: amountPaid heredado se respeta como pago', () => {
  const f = getGuestFinance(adult({ amountPaid: 30000 }), S);
  assert.equal(f.paid, 30000);
  assert.equal(f.payments.length, 1);
  assert.equal(f.payments[0].legacy, true);
});

test('Compatibilidad: payment "abonado" sin amountPaid = pago completo', () => {
  const f = getGuestFinance(adult({ payment: 'abonado' }), S);
  assert.equal(f.paid, 65000);
  assert.equal(f.status, 'pagado');
});

test('Celíaco se calcula como menú Adulto', () => {
  const f = getGuestFinance({ attendance: 'fiesta', menu: 'celiaco' }, S);
  assert.equal(f.category, 'adulto');
  assert.equal(f.price, 65000);
  assert.equal(f.cost, 56300);
});

test('Valores inválidos no generan NaN', () => {
  const f = getGuestFinance(adult({ payments: [{ amount: 'abc' }, { amount: -5 }, null] }), S);
  assert.equal(f.paid, 0);
  const t = computeTotals([adult({ amountPaid: 'x' })], { menus: { adulto: { cost: 'a' } } });
  assert.equal(t.expected, 65000);
  assert.equal(t.cateringCost, 56300);
});

test('Margen asegurado y excedente', () => {
  const f = getGuestFinance(adult({ payments: [pay(60000)] }), S);
  assert.equal(f.securedMargin, 3700);
  const over = getGuestFinance(adult({ payments: [pay(70000)] }), S);
  assert.equal(over.overpaid, 5000);
  assert.equal(over.remaining, 0);
});

test('Vista previa de pago', () => {
  const f = getGuestFinance(adult({ payments: [pay(30000)] }), S);
  const p = previewPayment(f, 20000);
  assert.equal(p.paid, 50000);
  assert.equal(p.remaining, 15000);
  assert.equal(p.status, 'parcial');
});

test('Gastos: atrasado, próximo y tranquilidad', () => {
  const today = '2026-10-06';
  const s = computeExpenses([
    { name: 'Seña catering', category: 'catering', amount: 500000, date: '2026-10-15', status: 'pendiente' },
    { name: 'Foto', category: 'fotografia', amount: 100000, date: '2026-09-01', status: 'pagado' },
  ], today);
  assert.equal(s.cateringScheduled, 500000);
  assert.equal(s.otherPaid, 100000);
  assert.equal(s.nextPayment.name, 'Seña catering');
  assert.equal(getPeaceOfMind(s).level, 'warn');

  const late = computeExpenses([{ name: 'DJ', category: 'musica', amount: 1, date: '2026-10-01', status: 'pendiente' }], today);
  assert.equal(getPeaceOfMind(late).level, 'alert');
  assert.equal(getPeaceOfMind(computeExpenses([], today)).level, 'ok');
});

test('Formato ARS y fechas', () => {
  assert.equal(formatARS(65000), '$65.000');
  assert.equal(formatARS(3177000), '$3.177.000');
  assert.equal(formatARS(NaN), '$0');
  assert.equal(formatDate('2026-10-06'), '06/10/2026');
});
