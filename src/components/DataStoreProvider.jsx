import { useState, useEffect } from 'react';
import { initDataStore } from '../db/dataStore';

export default function DataStoreProvider({ children }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    initDataStore()
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--surface-2, #f8fafc)',
      }}>
        <div className="otodu-loader">
          <span>O</span>
          <span>T</span>
          <span>O</span>
          <span>D</span>
          <span>U</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ color: 'var(--error, #dc2626)' }}>Gagal memuat data: {error}</p>
        <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ marginTop: 12 }}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return children;
}
