import {
  ArrowRight,
  BarChart3,
  Cloud,
  ShieldCheck,
  ShoppingBasket,
} from "lucide-react";
import { businesses, currency } from "../logic/ledger.js";

export default function LandingPage({ onGoogle, googleConfigured }) {
  return (
    <main className="ledger-landing" id="top">
      <section className="ledger-hero">
        <div className="ledger-hero-copy">
          <p className="ledger-eyebrow">
            <span /> FAMILY BUSINESS, IN SYNC
          </p>
          <h1>Good business starts with knowing your numbers.</h1>
          <p className="ledger-intro">
            Keep sales, costs, and stock together for Water, Ice, and Graham
            Bar. A clear daily view for the whole family.
          </p>
          <div className="ledger-hero-actions">
            <button className="ledger-button primary" onClick={onGoogle}>
              <span className="ledger-google-mark">G</span> Continue with Google
              <ArrowRight size={16} />
            </button>
          </div>
          <p className="ledger-setup-note">
            <ShieldCheck size={14} />
            {googleConfigured
              ? "Use your approved Google account to continue."
              : "Google sign-in setup is required for a private workspace."}
          </p>
        </div>
        <div className="ledger-preview" aria-label="Ledger overview">
          <div className="ledger-preview-top">
            <div>
              <span className="ledger-small-label">BUSINESS OVERVIEW</span>
              <h2>Current totals</h2>
            </div>
            <span className="ledger-demo-badge">
              <span /> LEDGER
            </span>
          </div>
          <div className="ledger-preview-total">
            <div>
              <span className="ledger-small-label">NET PROFIT</span>
              <strong>{currency.format(0)}</strong>
            </div>
          </div>
          <p className="ledger-preview-empty">No entries recorded yet</p>
          <div className="ledger-preview-lines">
            {businesses.map((business) => (
              <div className="ledger-preview-line" key={business.id}>
                <span className={`ledger-business-dot ${business.id}`} />
                <span>{business.name}</span>
                <strong>{currency.format(0)}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="ledger-proof"
        id="businesses"
        aria-label="Business tools"
      >
        <article>
          <span className="ledger-proof-icon blue">
            <BarChart3 size={18} />
          </span>
          <span>
            <strong>One shared view</strong>
            <small>See each business at a glance</small>
          </span>
        </article>
        <article>
          <span className="ledger-proof-icon green">
            <ShoppingBasket size={18} />
          </span>
          <span>
            <strong>Stock that adds up</strong>
            <small>Know what goes into every batch</small>
          </span>
        </article>
        <article>
          <span className="ledger-proof-icon amber">
            <Cloud size={18} />
          </span>
          <span>
            <strong>Ready for the family</strong>
            <small>Track your daily business activity</small>
          </span>
        </article>
      </section>
      <footer className="ledger-landing-footer" id="how-it-works">
        <span>Designed for Water, Ice, and Graham Bar.</span>
        <span>Recorded sales and expenses will appear in the ledger.</span>
      </footer>
    </main>
  );
}
