import { NavLink } from 'react-router-dom';
import { useStore } from '../store/useStore';

export default function Navbar() {
  const role = useStore(s => s.user.role);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/dashboard" className="navbar-brand">
          <span className="logo-dot" />
          <span>OTODU<span style={{ color: 'var(--sky-400)', fontWeight: 900 }}>v3</span></span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            🏠 Dashboard
          </NavLink>
          <NavLink
            to="/setup-ujian"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            📝 Kerjakan Soal
          </NavLink>
          <NavLink
            to="/statistik"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            📊 Statistik
          </NavLink>
          <NavLink
            to="/settings"
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            ⚙️ Setting
          </NavLink>
          {role === 'admin' ? (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{ color: 'var(--sky-600)', fontWeight: 800 }}
            >
              ⚙️ Admin Panel
            </NavLink>
          ) : (
            <NavLink
              to="/admin"
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              style={{ fontSize: 13, opacity: 0.7 }}
            >
              🔒 Login Admin
            </NavLink>
          )}
        </div>
      </div>
    </nav>
  );
}
