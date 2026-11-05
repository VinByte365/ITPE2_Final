import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { ArrowRight, ArrowUpRight } from '../components/Icons';
import { useContent } from '../data/ContentContext';
import { formatName } from '../data/modules';
import classPhotoOne from '../assets/class-01.jpg';
import classPhotoTwo from '../assets/class-02.jpg';

const pad = (value) => String(value).padStart(2, '0');

const courseFacts = [
  { label: 'University', value: 'Technological University of the Philippines – Taguig' },
  { label: 'Program', value: 'BS Information Technology' },
  { label: 'Section', value: 'NS-4A' },
  { label: 'Subject', value: 'ITPE — Computer System & Platform Technology' },
];

export default function AboutPage() {
  const { modules, presenterCount } = useContent();

  const roster = useMemo(() => {
    const people = new Map();

    modules.forEach((module) => {
      module.members.forEach(({ name }) => {
        if (!people.has(name)) {
          people.set(name, { name: formatName(name), modules: [] });
        }
        people.get(name).modules.push(module.id);
      });
    });

    return [...people.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [modules]);

  return (
    <div className="about-page">
      <header className="about-hero">
        <div className="shell about-hero-grid">
          <Reveal className="about-hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              About / BSIT-NS-4A
            </p>
            <h1>
              The class behind
              <br />
              the index<span className="accent">.</span>
            </h1>
            <p className="about-lead">
              <span className="nowrap">BSIT-NS-4A</span> is a section of BS
              Information Technology students at the Technological University of
              the Philippines – Taguig. This site
              collects the sixteen module presentations we produced for ITPE:
              Computer System and Platform Technology.
            </p>
          </Reveal>

          <Reveal className="about-hero-stats" delay={140}>
            <div>
              <span className="about-stat-value">{presenterCount}</span>
              <span className="about-stat-label">Presenters</span>
            </div>
            <div>
              <span className="about-stat-value">{modules.length}</span>
              <span className="about-stat-label">Modules</span>
            </div>
            <div>
              <span className="about-stat-value">01</span>
              <span className="about-stat-label">Professor</span>
            </div>
          </Reveal>
        </div>
      </header>

      <section className="about-gallery-section" aria-label="Class photographs">
        <div className="shell about-gallery">
          <Reveal className="gallery-main">
            <figure>
              <img
                src={classPhotoOne}
                alt="BSIT-NS-4A students seated together for a class photo in a lecture hall"
              />
              <figcaption>
                <span>fig. 01</span> The section after the final presentations.
              </figcaption>
            </figure>
          </Reveal>
          <Reveal className="gallery-side" delay={140}>
            <figure>
              <img
                src={classPhotoTwo}
                alt="BSIT-NS-4A students posing in rows during a class gathering"
              />
              <figcaption>
                <span>fig. 02</span> TUP Taguig, ITPE Final.
              </figcaption>
            </figure>
          </Reveal>
        </div>
      </section>

      <div className="course-facts">
        <div className="shell course-facts-grid">
          {courseFacts.map((fact) => (
            <div className="course-fact" key={fact.label}>
              <span className="course-fact-label">{fact.label}</span>
              <span className="course-fact-value">{fact.value}</span>
            </div>
          ))}
        </div>
      </div>

      <section className="section about-story">
        <div className="shell split-grid about-story-grid">
          <Reveal className="section-intro">
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              The brief
            </p>
            <h2 className="section-title">A semester of systems thinking.</h2>
          </Reveal>

          <Reveal className="story-copy" delay={100}>
            <p>
              The brief was to explain how a computer actually works — not just
              name its parts. Each pair took one layer of the stack, traced its
              history, described the technology as it exists today, and closed
              with the problems still being solved.
            </p>
            <p>
              The result is sixteen modules that move from hardware and number
              systems through operating systems, storage, web platforms, and
              analytics, ending with AI, security, IoT, and the mobile and games
              ecosystem.
            </p>
            <p>
              Every entry pairs a slide deck with a recorded discussion and a
              written summary, so the index can be read, watched, or searched.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="section professor-section">
        <div className="shell">
          <Reveal className="professor-card">
            <div className="professor-monogram" aria-hidden="true">
              JS
            </div>
            <div className="professor-copy">
              <p className="eyebrow">
                <span className="eyebrow-dot" />
                Subject professor
              </p>
              <h2>Prof. Julius Delfin Silang</h2>
              <p>
                Guided BSIT-NS-4A through the final module presentations collected
                in this index.
              </p>
            </div>
            <span className="professor-meta">ITPE / Final</span>
          </Reveal>
        </div>
      </section>

      <section className="section roster-section" id="roster">
        <div className="shell">
          <Reveal className="roster-head">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-dot" />
                Roster / {presenterCount} presenters
              </p>
              <h2 className="section-title">The people behind the modules.</h2>
            </div>
            <p className="roster-note">
              Every presenter, listed alphabetically with the module they worked
              on.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <ol className="roster-list">
              {roster.map((person, index) => (
                <li className="roster-row" key={person.name}>
                  <span className="roster-index">{pad(index + 1)}</span>
                  <span className="roster-name">{person.name}</span>
                  <span className="roster-modules">
                    {person.modules.map((moduleId) => (
                      <Link
                        key={moduleId}
                        to={`/topics/${moduleId}`}
                        aria-label={`Module ${pad(moduleId)}`}
                      >
                        {pad(moduleId)}
                      </Link>
                    ))}
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      </section>

      <section className="about-close">
        <div className="shell about-close-grid">
          <Reveal>
            <p className="eyebrow">
              <span className="eyebrow-dot" />
              The work
            </p>
            <h2>Read the index from the beginning.</h2>
          </Reveal>
          <Reveal className="about-close-actions" delay={100}>
            <Link to="/topics/1" className="btn btn-solid">
              Start with module 01
              <ArrowRight />
            </Link>
            <Link to="/topics" className="link-arrow">
              Browse all modules
              <ArrowUpRight />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
