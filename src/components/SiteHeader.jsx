import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useContent } from '../data/ContentContext';
import { ArrowUpRight } from './Icons';

const navItems = [
  { index: '01', label: 'Home', to: '/', match: (path) => path === '/' },
  {
    index: '02',
    label: 'Modules',
    to: '/topics',
    match: (path) => path.startsWith('/topics'),
  },
  { index: '03', label: 'About', to: '/about', match: (path) => path === '/about' },
];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { modules } = useContent();
  const { status, profile, logout } = useAuth();
  const location = useLocation();

  const dashboardPath =
    profile?.role === 'admin'
      ? '/admin/users'
      : profile?.role === 'faculty'
        ? '/faculty'
        : '/student';

  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!menuOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  return (
    <>
      <header className="site-header">
        <div className="shell header-inner">
        <Link
          to="/"
          className="brand"
          aria-label="Systems Index — BSIT-NS-3A home"
          onClick={() => setMenuOpen(false)}
        >
          <span className="brand-mark" aria-hidden="true">
            <span>3A</span>
          </span>
          <span className="brand-copy">
            <span className="brand-name">Systems Index</span>
            <span className="brand-sub">BSIT-NS-3A · TUP Taguig</span>
          </span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`nav-link ${item.match(location.pathname) ? 'is-active' : ''}`}
              aria-current={item.match(location.pathname) ? 'page' : undefined}
              onClick={() => setMenuOpen(false)}
            >
              <span className="nav-index">{item.index}</span>
              {item.label}
            </Link>
          ))}
          {isAuthenticated ? (
            <>
              <Link to={dashboardPath} className="nav-link" onClick={() => setMenuOpen(false)}>
                <span className="nav-index">04</span>
                Dashboard
              </Link>
              <span className="nav-link nav-user">{profile?.fullName || profile?.email}</span>
              <button type="button" className="nav-link nav-logout" onClick={() => { setMenuOpen(false); logout(); }}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>
                <span className="nav-index">04</span>
                Login
              </Link>
              <Link to="/register" className="nav-link" onClick={() => setMenuOpen(false)}>
                <span className="nav-index">05</span>
                Register
              </Link>
            </>
          )}
        </nav>

        <div className="header-meta" aria-hidden="true">
          <span>ITPE / Final</span>
          <strong>{modules.length} modules</strong>
        </div>

        <button
          type="button"
          className={`menu-toggle ${menuOpen ? 'is-open' : ''}`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
        </button>
        </div>
      </header>

      {menuOpen && (
        <div className="mobile-nav" id="mobile-navigation">
          <nav className="mobile-nav-list" aria-label="Mobile">
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.to}
                className={`mobile-nav-link ${item.match(location.pathname) ? 'is-active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="mobile-nav-index">{item.index}</span>
                <span>{item.label}</span>
                <ArrowUpRight />
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to={dashboardPath} className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="mobile-nav-index">04</span>
                  <span>Dashboard</span>
                  <ArrowUpRight />
                </Link>
                <button type="button" className="mobile-nav-link" onClick={() => { setMenuOpen(false); logout(); }}>
                  <span className="mobile-nav-index">05</span>
                  <span>Logout</span>
                  <ArrowUpRight />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="mobile-nav-index">04</span>
                  <span>Login</span>
                  <ArrowUpRight />
                </Link>
                <Link to="/register" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
                  <span className="mobile-nav-index">05</span>
                  <span>Register</span>
                  <ArrowUpRight />
                </Link>
              </>
            )}
          </nav>
          <div className="mobile-nav-meta">
            <span>Computer System &amp; Platform Technology</span>
            <span>BSIT-NS-3A · Technological University of the Philippines</span>
          </div>
        </div>
      )}
    </>
  );
}
