import React from 'react';

import { VIEWS } from '../utils/navigation';

export default function Navigation({ view, onChange }) {
  return (
    <nav className="app-nav" aria-label="Secciones">
      {VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          className="app-nav-btn"
          aria-current={view === v.id ? 'page' : undefined}
          onClick={() => onChange(v.id)}
        >
          <span className="app-nav-icon" aria-hidden="true">{v.icon}</span>
          {v.label}
        </button>
      ))}
    </nav>
  );
}
