import { useEffect } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import LandingNav from '../components/landing/LandingNav.jsx';
import LandingHeroDashboard from '../components/landing/LandingHeroDashboard.jsx';
import LandingRequestDetailPreview from '../components/landing/LandingRequestDetailPreview.jsx';
import '../styles/landing.css';

const BENEFITS = [
  {
    title: 'One centralised queue',
    body: 'All maintenance requests can be organised in one place.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    title: 'Clear responsibility',
    body: 'Administrators can assign requests to maintenance officers.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45v2h6v-2c0-2.66-5.33-4-8-4z"
          fill="currentColor"
        />
      </svg>
    )
  },
  {
    title: 'Visible progress',
    body: 'Users can follow the request status through resolution.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"
          fill="currentColor"
        />
      </svg>
    )
  }
];

const STEPS = [
  {
    num: 'STEP 01 — REPORT',
    title: 'Submit the issue.',
    body: 'Staff and students describe the problem and provide the relevant campus location.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  },
  {
    num: 'STEP 02 — ASSIGN',
    title: 'Give the request an owner.',
    body: 'An administrator assigns the request to a maintenance officer.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M16 11V7a4 4 0 0 0-8 0v4M5 11h14v10H5V11z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  },
  {
    num: 'STEP 03 — RESOLVE',
    title: 'Track it to completion.',
    body: 'The officer records progress and marks the issue resolved.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 4 12 14.01l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
];

export default function WelcomePage() {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const sectionId = location.state?.scrollTo;
    const hashId = window.location.hash.replace('#', '');
    const targetId = sectionId || hashId;
    if (!targetId) {
      return;
    }
    const frame = requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.state, location.pathname]);

  if (loading) {
    return <LoadingSpinner layout="page" />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="landing-page">
      <LandingNav />

      <section className="landing-section landing-hero" id="top">
        <div className="landing-hero-grid">
          <div className="landing-hero-copy">
            <p className="landing-eyebrow">Campus operations, simplified</p>
            <h1>Less chasing. Clearer campus maintenance.</h1>
            <p>
              Resolva replaces phone calls, paper forms, and scattered messages with one dashboard
              for your university.
            </p>
            <div className="landing-hero-ctas">
              <Link
                to="/admin/register"
                className="landing-btn landing-btn-primary landing-btn-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Set Up Your Organisation
              </Link>
              <Link
                to="/login"
                className="landing-btn landing-btn-secondary landing-btn-lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                Log In
              </Link>
            </div>
            <p className="landing-hero-note">
              For university administrators, staff and students, and maintenance teams.
            </p>
          </div>
          <LandingHeroDashboard />
        </div>
      </section>

      <section className="landing-section landing-section-block" id="for-universities">
        <div className="landing-compare-grid">
          <article className="landing-card landing-card-problem">
            <h2>Too many follow-ups.</h2>
            <ul>
              <li>Requests scattered across phone calls and group chats.</li>
              <li>Paper forms that are difficult to track.</li>
              <li>Uncertainty about who is handling an issue.</li>
              <li>No reliable record of completion.</li>
            </ul>
          </article>
          <article className="landing-card landing-card-solution">
            <h2>One place for all of it.</h2>
            <ul>
              <li>Every request recorded in one place.</li>
              <li>Clear ownership and assignment.</li>
              <li>Visible status updates.</li>
              <li>A documented resolution history.</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="landing-section landing-section-block" id="features">
        <h2 className="landing-section-heading">Designed for your university.</h2>
        <div className="landing-benefits-grid">
          {BENEFITS.map((item) => (
            <article key={item.title} className="landing-card landing-benefit-card">
              <div className="landing-benefit-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-block" id="how-it-works">
        <div className="landing-steps-header">
          <h2 className="landing-section-heading">How it works</h2>
          <p className="landing-section-lead">
            From the first report to a documented resolution — three clear steps for your campus.
          </p>
        </div>
        <div className="landing-steps-grid">
          {STEPS.map((step) => (
            <article key={step.num} className="landing-card landing-step-card">
              <p className="landing-step-num">{step.num}</p>
              <div className="landing-step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section-block" id="demo">
        <h2 className="landing-section-heading">See it in action.</h2>
        <p className="landing-section-lead">
          Staff and students report issues. Officers update status. Everyone can follow the progress—from the
          initial report to resolution.
        </p>
        <div className="landing-demo-grid">
          <div className="landing-demo-copy">
            <ul className="landing-demo-points">
              <li>Status history visible to requesters and staff</li>
              <li>Officers mark jobs in progress and completed</li>
              <li>Comments and updates stay with the request</li>
            </ul>
          </div>
          <LandingRequestDetailPreview />
        </div>
      </section>

      <section className="landing-final-cta" aria-labelledby="landing-cta-title">
        <h2 id="landing-cta-title">Bring every maintenance request into one place.</h2>
        <p>
          Give your university a clearer way to report problems, coordinate repairs, and track
          progress.
        </p>
        <Link
          to="/admin/register"
          className="landing-btn landing-btn-primary landing-btn-lg"
          target="_blank"
          rel="noopener noreferrer"
        >
          Set Up Your Organisation
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <p className="resolva-logo-text">Resolva</p>
            <p>
              University maintenance and service request system — one organisation, one queue, clear
              ownership from report to resolution.
            </p>
          </div>
          <nav className="landing-footer-links" aria-label="Footer">
            <a href="#how-it-works">How It Works</a>
            <a href="#features">Features</a>
            <a href="#for-universities">For Universities</a>
            <Link to="/login" target="_blank" rel="noopener noreferrer">
              Log In
            </Link>
            <Link to="/admin/register" target="_blank" rel="noopener noreferrer">
              Set Up Organisation
            </Link>
          </nav>
        </div>
        <p className="landing-footer-copy">
          © {new Date().getFullYear()} Resolva. Staff and students register through their institution&apos;s link.
        </p>
      </footer>
    </div>
  );
}
