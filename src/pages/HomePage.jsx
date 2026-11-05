import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { ArrowRight, ArrowUpRight } from '../components/Icons';
import { useContent } from '../data/ContentContext';
import classPhotoOne from '../assets/class-01.jpg';
import classPhotoTwo from '../assets/class-02.jpg';

const pad = (value) => String(value).padStart(2, '0');

export default function HomePage() {
  const { modules, themes, themeForModule, presenterCount } = useContent();
  const featured = modules.slice(0, 6);

  return (
    <div className="home">
      <section className="hero" id="home">
        <div className="shell hero-grid">
          <Reveal className="hero-copy" delay={60}>
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              Computer System &amp; Platform Technology
            </p>

            <h1 className="hero-title">
              <span>Computer systems,</span>
              <span className="accent">from silicon</span>
              <span>to cloud.</span>
            </h1>

            <p className="hero-lead">
              A field guide to the hardware, software, and platforms that run
              the modern world — assembled from sixteen module presentations by{' '}
              <span className="nowrap">BSIT-NS-4A</span> at TUP Taguig.
            </p>

            <div className="hero-actions">
              <Link to="/topics" className="btn btn-solid">
                Open the module index
                <ArrowRight />
              </Link>
              <Link to="/about" className="link-arrow">
                Meet the class
                <ArrowUpRight />
              </Link>
            </div>

            <p className="hero-lead" style={{ marginTop: 12 }}>
              Running a class?{' '}
              <Link to="/login" className="link-arrow">Sign in</Link> or{' '}
              <Link to="/register" className="link-arrow">create an account</Link>{' '}
              to use the Class LMS for subjects, topics, quizzes and grades.
            </p>

            <dl className="hero-stats">
              <div>
                <dt>Modules</dt>
                <dd>{modules.length}</dd>
              </div>
              <div>
                <dt>Presenters</dt>
                <dd>{presenterCount}</dd>
              </div>
              <div>
                <dt>Themes</dt>
                <dd>{pad(themes.length)}</dd>
              </div>
              <div>
                <dt>Class</dt>
                <dd>NS-4A</dd>
              </div>
            </dl>
          </Reveal>

          <Reveal className="hero-visual" delay={220}>
            <div className="hero-panel">
              <div className="panel-top">
                <span>Course index</span>
                <span>{modules.length} entries</span>
              </div>

              <ol className="hero-index">
                {featured.map((module) => (
                  <li key={module.id}>
                    <Link to={`/topics/${module.id}`} className="hero-index-row">
                      <span className="hero-index-num">{pad(module.id)}</span>
                      <span className="hero-index-name">{module.title}</span>
                      <span className="hero-index-theme">
                        {themeForModule(module.id)?.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>

              <Link to="/topics" className="panel-foot">
                <span>All {modules.length} modules</span>
                <ArrowUpRight />
              </Link>
            </div>
            <p className="hero-note">fig. 01 — Index, BSIT-NS-4A</p>
          </Reveal>
        </div>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[0, 1].map((group) => (
              <div className="marquee-group" key={group}>
                {modules.map((module) => (
                  <span className="marquee-item" key={`${group}-${module.id}`}>
                    <span className="marquee-dot" />
                    {module.title}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section course-map" id="course-map">
        <div className="shell split-grid">
          <Reveal className="section-intro">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              Course map
            </p>
            <h2 className="section-title">
              Four layers of a working computer.
            </h2>
            <p className="section-copy">
              The index moves from the physical machine outward: the components,
              the data they carry, the platforms built on top, and the systems
              shaping what comes next.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <ol className="theme-list">
              {themes.map((theme) => (
                <li key={theme.id}>
                  <Link to={`/topics?theme=${theme.id}`} className="theme-row">
                    <span className="theme-range">{theme.range}</span>
                    <span className="theme-body">
                      <span className="theme-name">{theme.label}</span>
                      <span className="theme-blurb">{theme.blurb}</span>
                      <span className="theme-modules">
                        {theme.modules
                          .map((id) => modules.find((item) => item.id === id)?.title)
                          .join(' · ')}
                      </span>
                    </span>
                    <ArrowUpRight className="theme-arrow" />
                  </Link>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="section class-preview" id="about">
        <div className="shell about-preview-grid">
          <Reveal className="photo-stack">
            <img
              src={classPhotoOne}
              alt="Students of BSIT-NS-4A gathered for a class photo in a lecture hall"
              className="photo-main"
              loading="lazy"
            />
            <img
              src={classPhotoTwo}
              alt="BSIT-NS-4A students posing together after a class presentation"
              className="photo-secondary"
              loading="lazy"
            />
            <span className="photo-caption">
              fig. 02 — BSIT-NS-4A, TUP Taguig
            </span>
          </Reveal>

          <Reveal className="class-copy" delay={120}>
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              The class
            </p>
            <h2 className="section-title">
              Thirty-two students.
              <br />
              Sixteen modules.
              <br />
              One shared index.
            </h2>
            <p className="section-copy">
              Each module was researched, presented, and recorded by a pair of
              students. Together they form a working survey of the systems we
              use every day — and the decisions underneath them.
            </p>

            <div className="professor-line">
              <span className="professor-label">Subject professor</span>
              <span className="professor-name">Prof. Julius Delfin Silang</span>
            </div>

            <Link to="/about" className="link-arrow">
              About BSIT-NS-4A
              <ArrowUpRight />
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="cta-band">
        <span className="cta-watermark" aria-hidden="true">
          {pad(modules.length)}
        </span>
        <div className="shell cta-grid">
          <Reveal>
            <p className="eyebrow eyebrow-light">
              <span className="eyebrow-dot" />
              Start anywhere
            </p>
            <h2>Begin with the foundation, or follow your curiosity.</h2>
          </Reveal>
          <Reveal className="cta-actions" delay={120}>
            <Link to="/topics/1" className="btn btn-paper">
              Read module 01
              <ArrowRight />
            </Link>
            <Link to="/topics" className="btn btn-ghost-light">
              Browse all modules
              <ArrowUpRight />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
