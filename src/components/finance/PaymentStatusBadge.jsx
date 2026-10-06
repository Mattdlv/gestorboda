import React from 'react';
import { PAYMENT_STATUS } from '../../utils/finance';

export default function PaymentStatusBadge({ status }) {
  const meta = PAYMENT_STATUS[status] || PAYMENT_STATUS.no_corresponde;
  return (
    <span className={`fin-badge tone-${meta.tone}`}>
      <span aria-hidden="true">{meta.icon}</span>
      {meta.label}
    </span>
  );
}
