import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import logoFull from '../assets/images/logo_full.png';

/* ── Particles (reused from landing) ───────────────────── */
function AuthParticles() {
  return (
    <div className="lp-particles" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="lp-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${3 + Math.random() * 6}px`,
            height: `${3 + Math.random() * 6}px`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ── Password strength meter ───────────────────────────── */
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score; // 0-5
}

const STRENGTH_CONFIG = [
  { label: '', color: 'transparent', width: '0%' },
  { label: 'Sangat Lemah', color: '#ef4444', width: '20%' },
  { label: 'Lemah', color: '#f97316', width: '40%' },
  { label: 'Cukup', color: '#f59e0b', width: '60%' },
  { label: 'Kuat', color: '#22c55e', width: '80%' },
  { label: 'Sangat Kuat', color: '#16a34a', width: '100%' },
];

function PasswordStrength({ password }) {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="auth-pw-strength">
      <div className="auth-pw-bar">
        <div
          className="auth-pw-bar-fill"
          style={{ width: config.width, background: config.color }}
        />
      </div>
      <span className="auth-pw-label" style={{ color: config.color }}>
        {config.label}
      </span>
    </div>
  );
}

/* ── Input with icon ───────────────────────────────────── */
function AuthInput({ icon, type = 'text', error, ...props }) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`auth-input-wrap ${error ? 'auth-input-error' : ''}`}>
      <span className="auth-input-icon">{icon}</span>
      <input
        type={isPassword && showPw ? 'text' : type}
        className="auth-input"
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          className="auth-pw-toggle"
          onClick={() => setShowPw(!showPw)}
          tabIndex={-1}
          aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {showPw ? '🙈' : '👁️'}
        </button>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   AUTH PAGE — Login & Register
   ══════════════════════════════════════════════════════════ */
export default function AuthPage() {
  const navigate = useNavigate();
  const { setUserName, loginStudent, registerStudent } = useStore();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  const isLogin = mode === 'login';

  const validateLogin = () => {
    const errors = {};
    if (!email.trim()) errors.email = 'Email wajib diisi';
    if (!password) errors.password = 'Password wajib diisi';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateRegister = () => {
    const errors = {};
    if (!name.trim()) errors.name = 'Nama wajib diisi';
    if (!email.trim()) errors.email = 'Email wajib diisi';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Format email tidak valid';
    if (!password) errors.password = 'Password wajib diisi';
    else if (password.length < 6) errors.password = 'Password minimal 6 karakter';
    if (password !== confirmPw) errors.confirmPw = 'Password tidak sama';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!validateLogin()) return;
    } else {
      if (!validateRegister()) return;
    }

    setLoading(true);

    // Simulate auth delay for UX feel
    await new Promise(r => setTimeout(r, 800));

    try {
      if (isLogin) {
        // Check localStorage for registered users
        const users = JSON.parse(localStorage.getItem('otodu-users') || '[]');
        const user = users.find(u => u.email === email.trim().toLowerCase());

        if (!user) {
          setError('Akun tidak ditemukan. Silakan daftar terlebih dahulu.');
          setLoading(false);
          return;
        }
        if (user.password !== password) {
          setError('Password salah. Silakan coba lagi.');
          setLoading(false);
          return;
        }

        // Login success
        setUserName(user.name);
        localStorage.setItem('otodu-auth', JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email,
          loggedIn: true,
          loginAt: new Date().toISOString(),
        }));
        navigate('/dashboard');
      } else {
        // Register
        const users = JSON.parse(localStorage.getItem('otodu-users') || '[]');
        if (users.find(u => u.email === email.trim().toLowerCase())) {
          setError('Email sudah terdaftar. Silakan login.');
          setLoading(false);
          return;
        }

        const newUser = {
          id: `user-${Date.now()}`,
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          joinDate: new Date().toISOString(),
        };

        users.push(newUser);
        localStorage.setItem('otodu-users', JSON.stringify(users));

        // Auto login after register
        setUserName(newUser.name);
        localStorage.setItem('otodu-auth', JSON.stringify({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          loggedIn: true,
          loginAt: new Date().toISOString(),
        }));
        navigate('/dashboard');
      }
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
    setFieldErrors({});
    setPassword('');
    setConfirmPw('');
  };

  return (
    <div className="auth-page">
      <AuthParticles />

      {/* Left decorative panel */}
      <div className="auth-left">
        <div className="auth-left-content">
          <a href="/" className="lp-nav-brand" style={{ marginBottom: 40 }}>
            <img src={logoFull} alt="OTODU" style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </a>

          <h1 className="auth-left-title">
            {isLogin ? 'Selamat Datang Kembali!' : 'Bergabung Sekarang!'}
          </h1>
          <p className="auth-left-sub">
            {isLogin
              ? 'Lanjutkan perjalanan UTBK-mu. Setiap soal yang kamu kerjakan membawamu selangkah lebih dekat.'
              : 'Buat akun gratis dan mulai latihan UTBK dengan adaptive learning yang memahami kemampuanmu.'}
          </p>

          <div className="auth-features">
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🧠</span>
              <div>
                <strong>Adaptive Learning</strong>
                <p>Soal dipilih sesuai kelemahanmu</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">📊</span>
              <div>
                <strong>Statistik Detail</strong>
                <p>Pantau progres per subtes</p>
              </div>
            </div>
            <div className="auth-feature-item">
              <span className="auth-feature-icon">🎯</span>
              <div>
                <strong>Target Harian</strong>
                <p>Konsistensi adalah kunci sukses</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Tab switch */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => switchMode()}
              type="button"
            >
              Masuk
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => switchMode()}
              type="button"
            >
              Daftar
            </button>
          </div>

          <div className="auth-card-body">
            <div className="auth-header">
              <h2>{isLogin ? 'Masuk ke OTODU' : 'Buat Akun Baru'}</h2>
              <p>{isLogin
                ? 'Masukkan email dan password akunmu'
                : 'Daftar gratis dalam 30 detik'}</p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {/* Name — register only */}
              {!isLogin && (
                <div className="auth-field">
                  <label>Nama Lengkap</label>
                  <AuthInput
                    icon="👤"
                    placeholder="Nama kamu"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    error={fieldErrors.name}
                    autoComplete="name"
                  />
                  {fieldErrors.name && (
                    <span className="auth-field-error">{fieldErrors.name}</span>
                  )}
                </div>
              )}

              {/* Email */}
              <div className="auth-field">
                <label>Email</label>
                <AuthInput
                  icon="✉️"
                  type="email"
                  placeholder="nama@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  error={fieldErrors.email}
                  autoComplete="email"
                />
                {fieldErrors.email && (
                  <span className="auth-field-error">{fieldErrors.email}</span>
                )}
              </div>

              {/* Password */}
              <div className="auth-field">
                <label>Password</label>
                <AuthInput
                  icon="🔒"
                  type="password"
                  placeholder={isLogin ? 'Masukkan password' : 'Minimal 6 karakter'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  error={fieldErrors.password}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
                {fieldErrors.password && (
                  <span className="auth-field-error">{fieldErrors.password}</span>
                )}
                {!isLogin && <PasswordStrength password={password} />}
              </div>

              {/* Confirm password — register only */}
              {!isLogin && (
                <div className="auth-field">
                  <label>Konfirmasi Password</label>
                  <AuthInput
                    icon="🔐"
                    type="password"
                    placeholder="Ketik ulang password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    error={fieldErrors.confirmPw}
                    autoComplete="new-password"
                  />
                  {fieldErrors.confirmPw && (
                    <span className="auth-field-error">{fieldErrors.confirmPw}</span>
                  )}
                </div>
              )}

              {/* Error banner */}
              {error && (
                <div className="auth-error-banner">
                  <span>⚠️</span> {error}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className={`btn btn-primary btn-lg btn-block auth-submit ${loading ? 'auth-loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <span className="auth-spinner" />
                ) : isLogin ? (
                  '🚀 Masuk'
                ) : (
                  '✨ Daftar Sekarang'
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span>atau</span>
            </div>

            {/* Guest access */}
            <button
              type="button"
              className="btn btn-secondary btn-block auth-guest"
              onClick={() => navigate('/dashboard')}
            >
              👻 Coba Dulu Tanpa Akun
            </button>

            {/* Switch mode text */}
            <p className="auth-switch">
              {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
              <button type="button" onClick={switchMode}>
                {isLogin ? 'Daftar Sekarang' : 'Masuk'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
