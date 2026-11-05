import { Link } from 'react-router-dom';
import { ArrowUpRight } from './Icons';
import { PRODUCT_NAME } from '../lib/product-name';

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-brandline">
              <span className="footer-mark" aria-hidden="true">
                3A
              </span>
              <span>{PRODUCT_NAME}</span>
            </Link>
            <p>
              Sixteen modules on the hardware, software, and platforms that run
              modern computing. Built from the final presentations of BSIT-NS-3A.
            </p>
          </div>

          <nav className="footer-nav" aria-label="Footer">
            <span className="footer-label">Explore</span>
            <Link to="/">Home</Link>
            <Link to="/topics">Module index</Link>
            <Link to="/about">About the class</Link>
          </nav>

          <div className="footer-nav">
            <span className="footer-label">Course</span>
            <span>Computer System &amp; Platform Technology</span>
            <span>ITPE Final</span>
            <span>TUP Taguig</span>
          </div>
        </div>

        <div className="footer-bottom">
          <span>
            © {year} BSIT-NS-3A. All rights reserved.
          </span>
          <a href="#top" className="footer-top">
            Back to top <ArrowUpRight />
          </a>
        </div>
      </div>
    </footer>
  );
}
