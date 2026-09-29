import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Cloud,
  Cookie,
  Droplets,
  ShieldCheck,
  ShoppingBasket,
  Snowflake,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { businesses, currency } from "../logic/ledger.js";

const PREVIEW_DATA = {
  all: {
    title: "All Businesses Combined",
    profit: 5820,
    income: 11450,
    units: 245,
    note: "Consolidated family totals",
  },
  water: {
    title: "Purified Water Business",
    profit: 2150,
    income: 4200,
    units: 120,
    note: "Gallons delivered & refilled",
  },
  ice: {
    title: "Tube & Bag Ice Business",
    profit: 1680,
    income: 3150,
    units: 85,
    note: "Bags packaged & sold",
  },
  graham: {
    title: "Graham Bar Production",
    profit: 1990,
    income: 4100,
    units: 40,
    note: "Mango, Cheesecake, Cookies & Cream",
  },
};

export default function LandingPage({ onGoogle, googleConfigured }) {
  const [activeTab, setActiveTab] = useState("all");
  const currentPreview = PREVIEW_DATA[activeTab];

  return (
    <main className="ledger-landing" id="top">
      <section className="ledger-hero">
        <div className="ledger-hero-copy">
          <p className="ledger-eyebrow">
            <span className="pulse-dot" /> FAMILY BUSINESS, IN SYNC
          </p>
          <h1>Good business starts with knowing your numbers.</h1>
          <p className="ledger-intro">
            Keep sales, costs, and stock together for Water, Ice, and Graham
            Bar. A clear daily view for the whole family to stay aligned and profitable.
          </p>

          <div className="ledger-hero-actions">
            <Link to="/app" className="ledger-button primary large">
              <Sparkles size={16} /> Explore Live Demo
              <ArrowRight size={16} />
            </Link>

            <button className="ledger-button secondary large" onClick={onGoogle}>
              <span className="ledger-google-mark">G</span> Continue with Google
            </button>
          </div>

          <p className="ledger-setup-note">
            <ShieldCheck size={16} />
            {googleConfigured
              ? "Use your approved Google account to access your private ledger."
              : "Demo workspace available immediately without login."}
          </p>
        </div>

        {/* Interactive Live Preview Card */}
        <div className="ledger-preview" aria-label="Interactive Ledger Preview">
          <div className="ledger-preview-top">
            <div>
              <span className="ledger-small-label">INTERACTIVE PREVIEW</span>
              <h2>{currentPreview.title}</h2>
            </div>
            <span className="ledger-demo-badge">
              <span /> LIVE DEMO
            </span>
          </div>

          {/* Interactive Business Tab Selector */}
          <div className="ledger-preview-tabs" role="tablist">
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "water" ? "active" : ""}`}
              onClick={() => setActiveTab("water")}
            >
              <Droplets size={13} /> Water
            </button>
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "ice" ? "active" : ""}`}
              onClick={() => setActiveTab("ice")}
            >
              <Snowflake size={13} /> Ice
            </button>
            <button
              type="button"
              className={`preview-tab-btn ${activeTab === "graham" ? "active" : ""}`}
              onClick={() => setActiveTab("graham")}
            >
              <Cookie size={13} /> Graham Bar
            </button>
          </div>

          <div className="ledger-preview-total">
            <div>
              <span className="ledger-small-label">ESTIMATED NET PROFIT</span>
              <strong className="preview-profit-num">{currency.format(currentPreview.profit)}</strong>
            </div>
            <div className="preview-stat-pill">
              <TrendingUp size={14} />
              <span>{currentPreview.units} sold</span>
            </div>
          </div>

          <p className="ledger-preview-note-text">{currentPreview.note}</p>

          <div className="ledger-preview-lines">
            {businesses.map((business) => {
              const bizData = PREVIEW_DATA[business.id];
              const isHighlighted = activeTab === "all" || activeTab === business.id;
              return (
                <div
                  className={`ledger-preview-line ${isHighlighted ? "highlighted" : "dimmed"}`}
                  key={business.id}
                  onClick={() => setActiveTab(business.id)}
                  style={{ cursor: "pointer" }}
                >
                  <span className={`ledger-business-dot ${business.id}`} />
                  <span>{business.name}</span>
                  <strong>{currency.format(bizData.profit)}</strong>
                </div>
              );
            })}
          </div>

          <div className="ledger-preview-cta">
            <Link to="/app" className="ledger-preview-link">
              Open Full Workspace <ArrowRight size={14} />
            </Link>
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
            <BarChart3 size={22} />
          </span>
          <div>
            <strong>One shared family view</strong>
            <small>See real-time profits, revenue, and daily trends at a glance.</small>
          </div>
        </article>
        <article>
          <span className="ledger-proof-icon green">
            <ShoppingBasket size={22} />
          </span>
          <div>
            <strong>Smart stock tracking</strong>
            <small>Monitor ingredients, batch costs, and live inventory levels.</small>
          </div>
        </article>
        <article>
          <span className="ledger-proof-icon amber">
            <Cloud size={22} />
          </span>
          <div>
            <strong>Accessible anywhere</strong>
            <small>Works seamlessly across phones, tablets, and computers.</small>
          </div>
        </article>
      </section>

      <footer className="ledger-landing-footer" id="how-it-works">
        <span>Designed for Water, Ice, and Graham Bar family businesses.</span>
        <span>Secure local storage with optional Supabase cloud sync.</span>
      </footer>
    </main>
  );
}
