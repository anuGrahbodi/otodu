import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoFull from '../assets/images/logo_full.png';
import logoFace from '../assets/images/logo_face.png';
import testmateLogo from '../assets/images/testmate.png';

function getDaysUntilUTBK() {
  const targetDate = new Date('2027-04-21T00:00:00');
  const now = new Date();
  const diffTime = targetDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

/* ── Animated counter hook ─────────────────────────────── */
function useCountUp(end, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();
          const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end, duration, startOnView]);

  return { count, ref };
}

/* ── Scroll reveal hook ────────────────────────────────── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, visible };
}

/* ── Feature data ──────────────────────────────────────── */
const FEATURES = [
  {
    icon: '🧠',
    title: 'Adaptive Learning',
    desc: 'Sistem pintar yang menganalisis kelemahanmu dan memilih soal yang paling kamu butuhkan. Belajar jadi lebih efisien.',
    gradient: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  },
  {
    icon: '📊',
    title: 'Statistik Real-time',
    desc: 'Pantau progres per subtes dengan radar chart, lihat tren peningkatan mingguan, dan identifikasi area yang perlu diperbaiki.',
    gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
  },
  {
    icon: '🎯',
    title: 'Target Harian',
    desc: 'Set target belajar harian dengan mode Speedrun atau Santai. Konsistensi setiap hari adalah kunci lolos UTBK.',
    gradient: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  },
];

const STEPS = [
  { num: '01', icon: '📚', title: 'Pilih Subtes', desc: '6 subtes UTBK lengkap — pilih manual atau biarkan AI yang tentukan berdasarkan kelemahanmu.' },
  { num: '02', icon: '✍️', title: 'Kerjakan Soal', desc: 'Soal dipilih secara adaptif sesuai kemampuanmu. Ada PG, Pilihan Majemuk, dan Isian Singkat.' },
  { num: '03', icon: '🔍', title: 'Review & Analisis', desc: 'Lihat pembahasan lengkap, alasan salah (metakognitif), dan statistik detail per subtes.' },
];

const COMPARISON = [
  { feature: 'Adaptive Learning', book: false, bimbel: false, otodu: true },
  { feature: 'Statistik Per Subtes', book: false, bimbel: 'Terbatas', otodu: true },
  { feature: 'Analisis Metakognitif', book: false, bimbel: false, otodu: true },
  { feature: 'Kapan Saja, Di Mana Saja', book: false, bimbel: false, otodu: true },
  { feature: '3 Tipe Soal (PG, PMK, IS)', book: false, bimbel: true, otodu: true },
  { feature: 'Harga', book: 'Rp50-100rb', bimbel: 'Rp2-10jt', otodu: 'GRATIS' },
];

const SUBJECTS_LIST = [
  { icon: '📐', label: 'Penalaran Matematika', color: '#0ea5e9' },
  { icon: '🧠', label: 'Penalaran Umum', color: '#8b5cf6' },
  { icon: '📖', label: 'Literasi Bahasa Indonesia', color: '#f59e0b' },
  { icon: '🌐', label: 'Literasi Bahasa Inggris', color: '#10b981' },
  { icon: '✍️', label: 'Pemahaman Bacaan & Menulis', color: '#ec4899' },
  { icon: '🔢', label: 'Pengetahuan Kuantitatif', color: '#6366f1' },
];

/* ── Particles background ──────────────────────────────── */
function HeroParticles() {
  return (
    <div className="lp-particles" aria-hidden="true">
      {Array.from({ length: 18 }).map((_, i) => (
        <div
          key={i}
          className="lp-particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   LANDING PAGE
   ══════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);

  const soalCounter = useCountUp(850, 2200);
  const subtesCounter = useCountUp(6, 1400);
  const tipeCounter = useCountUp(3, 1200);

  const featReveal = useReveal();
  const stepsReveal = useReveal();
  const compReveal = useReveal();
  const subtesReveal = useReveal();
  const ctaReveal = useReveal();

  const goAuth = () => navigate('/auth');

  return (
    <div className="lp">
      {/* ── NAVBAR ───────────────────────────────────── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <a href="#hero" className="lp-nav-brand">
            <img src={logoFull} alt="OTODU" style={{ height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
          </a>

          <div className={`lp-nav-links ${mobileMenu ? 'open' : ''}`}>
            <a href="#fitur" onClick={() => setMobileMenu(false)}>Fitur</a>
            <a href="#cara-kerja" onClick={() => setMobileMenu(false)}>Cara Kerja</a>
            <a href="#subtes" onClick={() => setMobileMenu(false)}>Subtes</a>
            <a href="#perbandingan" onClick={() => setMobileMenu(false)}>Perbandingan</a>
            <a href="#" className="lp-nav-login" onClick={(e) => { e.preventDefault(); setMobileMenu(false); goAuth(); }}>Masuk</a>
            <button className="btn btn-primary btn-sm lp-nav-cta" onClick={goAuth}>
              ✨ Daftar Gratis
            </button>
          </div>

          <button
            className="lp-hamburger"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <span className={mobileMenu ? 'open' : ''} />
          </button>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────── */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-grid">
          <div className="lp-hero-text">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <img src={logoFace} alt="Logo" style={{ height: 90, objectFit: 'contain' }} />
              <h1 className="lp-hero-title" style={{ margin: 0 }}>OTODU</h1>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
              <span style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', fontWeight: 500, letterSpacing: '0.02em' }}>Powered by</span>
              <img src={testmateLogo} alt="Testmate" style={{ height: 28, objectFit: 'contain' }} />
            </div>
            <p className="lp-hero-sub" style={{ marginTop: '24px' }}>
              Sistem adaptive learning yang memilih soal berdasarkan kemampuanmu.
            </p>
            <div className="lp-hero-actions">
              <button className="btn btn-primary btn-lg lp-cta-glow" onClick={goAuth}>
                🚀 Mulai Latihan Gratis
              </button>
              <a href="#cara-kerja" className="btn btn-ghost btn-lg lp-hero-link">
                📖 Lihat Cara Kerja
              </a>
            </div>
          </div>

          <div className="lp-hero-visual">
            <div className="lp-mockup">
              {/* Floating dashboard preview */}
              <div className="lp-mockup-screen">
                <div className="lp-mockup-topbar">
                  <span className="lp-mockup-dot red" />
                  <span className="lp-mockup-dot yellow" />
                  <span className="lp-mockup-dot green" />
                  <span className="lp-mockup-url">otodu.app/dashboard</span>
                </div>
                <div className="lp-mockup-body">
                  <div className="lp-mockup-greeting">Halo, Pejuang UTBK! 👋</div>
                  <div className="lp-mockup-countdown">
                    <span className="lp-mockup-days">{getDaysUntilUTBK()}</span>
                    <span className="lp-mockup-label">Hari menuju UTBK</span>
                  </div>
                  <div className="lp-mockup-progress">
                    <div className="lp-mockup-bar">
                      <div className="lp-mockup-bar-fill" style={{ width: '72%' }} />
                    </div>
                    <span className="lp-mockup-pct">72%</span>
                  </div>
                  <div className="lp-mockup-stats">
                    <div className="lp-mockup-stat"><span>18/25</span><small>Soal</small></div>
                    <div className="lp-mockup-stat"><span>14/15</span><small>Benar</small></div>
                    <div className="lp-mockup-stat"><span>85%</span><small>Skor</small></div>
                  </div>
                </div>
              </div>

              {/* Floating elements */}
              <div className="lp-float lp-float-1">
                <span>🧠</span> Adaptive AI
              </div>
              <div className="lp-float lp-float-2">
                <span>✅</span> 14 Benar
              </div>
              <div className="lp-float lp-float-3">
                <span>📊</span> +12% minggu ini
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS STRIP ─────────────────────────────── */}
      <section className="lp-metrics">
        <div className="lp-metrics-inner">
          <div className="lp-metric" ref={soalCounter.ref}>
            <span className="lp-metric-num">{soalCounter.count}+</span>
            <span className="lp-metric-label">Bank Soal UTBK</span>
          </div>
          <div className="lp-metric-divider" />
          <div className="lp-metric" ref={subtesCounter.ref}>
            <span className="lp-metric-num">{subtesCounter.count}</span>
            <span className="lp-metric-label">Subtes Lengkap</span>
          </div>
          <div className="lp-metric-divider" />
          <div className="lp-metric" ref={tipeCounter.ref}>
            <span className="lp-metric-num">{tipeCounter.count}</span>
            <span className="lp-metric-label">Tipe Soal</span>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────── */}
      <section
        className={`lp-section ${featReveal.visible ? 'lp-visible' : ''}`}
        ref={featReveal.ref}
        id="fitur"
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">✨ Kenapa OTODU?</span>
            <h2 className="lp-section-title">Fitur yang Membedakan</h2>
            <p className="lp-section-sub">
              Dirancang khusus untuk siswa UTBK yang ingin belajar lebih cerdas, bukan lebih keras.
            </p>
          </div>

          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div className="lp-feature-card" key={i} style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="lp-feature-icon" style={{ background: f.gradient }}>
                  {f.icon}
                </div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────── */}
      <section
        className={`lp-section lp-section-alt ${stepsReveal.visible ? 'lp-visible' : ''}`}
        ref={stepsReveal.ref}
        id="cara-kerja"
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">🔄 Cara Kerja</span>
            <h2 className="lp-section-title">Mulai dalam 3 Langkah</h2>
            <p className="lp-section-sub">
              Tanpa registrasi, tanpa setup ribet. Langsung belajar.
            </p>
          </div>

          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <div className="lp-step" key={i} style={{ animationDelay: `${i * 0.2}s` }}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
                {i < STEPS.length - 1 && <div className="lp-step-connector" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SUBTES SHOWCASE ───────────────────────────── */}
      <section
        className={`lp-section ${subtesReveal.visible ? 'lp-visible' : ''}`}
        ref={subtesReveal.ref}
        id="subtes"
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">📚 Cakupan Materi</span>
            <h2 className="lp-section-title">6 Subtes UTBK Lengkap</h2>
            <p className="lp-section-sub">
              Semua subtes UTBK 2025/2026 tersedia dengan bank soal yang terus diperbarui.
            </p>
          </div>

          <div className="lp-subtes-grid">
            {SUBJECTS_LIST.map((s, i) => (
              <div className="lp-subtes-card" key={i} style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="lp-subtes-icon" style={{ background: s.color + '18', color: s.color }}>
                  {s.icon}
                </div>
                <span className="lp-subtes-label">{s.label}</span>
                <div className="lp-subtes-bar">
                  <div className="lp-subtes-bar-fill" style={{ background: s.color, width: `${60 + Math.random() * 35}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPARISON TABLE ──────────────────────────── */}
      <section
        className={`lp-section lp-section-alt ${compReveal.visible ? 'lp-visible' : ''}`}
        ref={compReveal.ref}
        id="perbandingan"
      >
        <div className="lp-container">
          <div className="lp-section-header">
            <span className="lp-section-badge">⚖️ Perbandingan</span>
            <h2 className="lp-section-title">Kenapa Bukan yang Lain?</h2>
          </div>

          <div className="lp-table-wrap">
            <table className="lp-table">
              <thead>
                <tr>
                  <th>Fitur</th>
                  <th>📚 Buku Soal</th>
                  <th>🏫 Bimbel Biasa</th>
                  <th className="lp-table-highlight">✨ OTODU</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i}>
                    <td className="lp-table-feature">{row.feature}</td>
                    <td>{renderCell(row.book)}</td>
                    <td>{renderCell(row.bimbel)}</td>
                    <td className="lp-table-highlight">{renderCell(row.otodu)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────── */}
      <section
        className={`lp-cta-section ${ctaReveal.visible ? 'lp-visible' : ''}`}
        ref={ctaReveal.ref}
      >
        <div className="lp-cta-inner">
          <h2>Siap Taklukkan UTBK?</h2>
          <p>Mulai latihan sekarang. Gratis, tanpa kartu kredit.</p>
          <button className="btn btn-lg lp-cta-white" onClick={goAuth}>
            🚀 Daftar Sekarang — Gratis
          </button>
          <p className="lp-cta-small">Bergabung dan mulai perjalanan UTBK-mu hari ini</p>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-nav-brand" style={{ fontSize: 22, display: 'block', marginBottom: '16px' }}>
              <img src={logoFull} alt="OTODU" style={{ height: 40, objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            </div>
            <p>Platform latihan UTBK dengan adaptive learning. Belajar lebih cerdas, bukan lebih keras.</p>
          </div>

          <div className="lp-footer-links">
            <div>
              <h4>Platform</h4>
              <a href="#fitur">Fitur</a>
              <a href="#cara-kerja">Cara Kerja</a>
              <a href="#subtes">Subtes</a>
              <a href="#perbandingan">Perbandingan</a>
            </div>
            <div>
              <h4>Mulai</h4>
              <a onClick={goAuth} style={{ cursor: 'pointer' }}>Daftar</a>
              <a onClick={goAuth} style={{ cursor: 'pointer' }}>Masuk</a>
              <a onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>Dashboard</a>
            </div>
          </div>
        </div>

        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} OTODU. All rights reserved.</p>
          <p>Dibuat dengan ❤️ untuk pejuang UTBK Indonesia</p>
        </div>
      </footer>
    </div>
  );
}

function renderCell(value) {
  if (value === true) return <span className="lp-check">✓</span>;
  if (value === false) return <span className="lp-cross">✗</span>;
  if (value === 'GRATIS') return <span className="lp-free">{value}</span>;
  return <span className="lp-cell-text">{value}</span>;
}
