import { useEffect, useRef, useState } from "react";
import { Plus, RefreshCw, Sparkles, Trash2 } from "lucide-react";
import AppSidebar from "./AppSidebar.jsx";
import DashboardSkeleton from "./DashboardSkeleton.jsx";
import QuickRecordModal from "./QuickRecordModal.jsx";
import { pageTitles } from "../logic/ledger.js";
import { supabaseConfigured } from "../services/supabase.js";

const PERIOD_PILLS = [
  { id: "today", label: "Today" },
  { id: "week", label: "7 Days" },
  { id: "month", label: "This Month" },
  { id: "all", label: "All Time" },
  { id: "custom", label: "Custom" },
];

export default function WorkspaceLayout({
  page,
  ledger,
  authUser,
  syncStatus,
  isSyncing,
  onSyncNow,
  sidebarOpen,
  setSidebarOpen,
  onNavigate,
  onSignOut,
  onToast,
  children,
}) {
  const [quickRecordOpen, setQuickRecordOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const customRef = useRef(null);

  // Close popover when clicking outside
  useEffect(() => {
    if (!customOpen) return;
    const handler = (e) => {
      if (customRef.current && !customRef.current.contains(e.target)) {
        setCustomOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [customOpen]);

  const handlePillClick = (id) => {
    if (id === "custom") {
      ledger.setPeriod("custom");
      setCustomOpen((prev) => !prev);
    } else {
      ledger.setPeriod(id);
      setCustomOpen(false);
    }
  };

  return (
    <div className="ledger-workspace">
      <button
        className={`ledger-scrim ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-label="Close navigation"
        tabIndex={sidebarOpen ? 0 : -1}
      />
      <AppSidebar
        activePage={page}
        authUser={authUser}
        onSignOut={onSignOut}
        onNavigate={onNavigate}
        isOpen={sidebarOpen}
      />
      <main className="ledger-main">
        <div className="ledger-content">
          <div className="ledger-page-heading">
            <div className="ledger-page-title-group">
              <span className="ledger-small-label">FAMILY BUSINESS BOOK</span>
              <h1>{pageTitles[page]}</h1>
            </div>

            <div className="ledger-controls">
              {/* Period Segmented Pills */}
              <div className="ledger-period-segmented" role="tablist" aria-label="Select date period">
                {PERIOD_PILLS.map((pill) => {
                  const isCustom = pill.id === "custom";
                  const isActive = ledger.periodSelection === pill.id;

                  if (isCustom) {
                    return (
                      <div key="custom" className="ledger-custom-pill-wrapper" ref={customRef}>
                        <button
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-haspopup="true"
                          aria-expanded={customOpen}
                          className={`ledger-period-pill ${isActive ? "active" : ""}`}
                          onClick={() => handlePillClick("custom")}
                        >
                          Custom
                        </button>

                        {customOpen && (
                          <div className="ledger-custom-popover" role="dialog" aria-label="Custom date range">
                            <p className="ledger-custom-popover-title">Custom date range</p>
                            <div className="ledger-custom-popover-fields">
                              <label className="ledger-custom-popover-field">
                                <span>From</span>
                                <input
                                  type="date"
                                  aria-label="Start date"
                                  value={ledger.startDate}
                                  onChange={(e) => ledger.setStartDate(e.target.value)}
                                />
                              </label>
                              <span className="ledger-custom-popover-sep" aria-hidden="true">→</span>
                              <label className="ledger-custom-popover-field">
                                <span>To</span>
                                <input
                                  type="date"
                                  aria-label="End date"
                                  value={ledger.endDate}
                                  onChange={(e) => ledger.setEndDate(e.target.value)}
                                />
                              </label>
                            </div>
                            <button
                              type="button"
                              className="ledger-button primary ledger-custom-popover-apply"
                              onClick={() => setCustomOpen(false)}
                            >
                              Apply
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <button
                      key={pill.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`ledger-period-pill ${isActive ? "active" : ""}`}
                      onClick={() => handlePillClick(pill.id)}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>

              {/* Prominent Quick Action Button */}
              <button
                type="button"
                className="ledger-button primary ledger-quick-btn"
                onClick={() => setQuickRecordOpen(true)}
              >
                <Plus size={16} strokeWidth={2.5} />
                <span>Record Transaction</span>
              </button>
            </div>
          </div>

          {ledger.isLoading ? <DashboardSkeleton /> : children}

          {page !== "admin" && (
            <div className="ledger-workspace-footer">
              <span role="status">{syncStatus}</span>
              <div className="ledger-footer-actions">
                {ledger.clearData && (
                  <button
                    type="button"
                    className="ledger-refresh-button danger-btn"
                    title="Clear all stored data back to zero"
                    onClick={async () => {
                      if (
                        window.confirm(
                          "Clear all recorded transactions and reset stocks? This will also remove data from Supabase.",
                        )
                      ) {
                        await ledger.clearData();
                        onToast?.("Ledger reset to empty.");
                      }
                    }}
                  >
                    <Trash2 size={13} /> Reset
                  </button>
                )}

                {supabaseConfigured && (
                  <button
                    type="button"
                    className="ledger-refresh-button"
                    onClick={onSyncNow}
                    disabled={isSyncing}
                  >
                    <RefreshCw
                      size={14}
                      className={isSyncing ? "spinning" : ""}
                    />{" "}
                    Sync now
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <QuickRecordModal
        isOpen={quickRecordOpen}
        onClose={() => setQuickRecordOpen(false)}
        onToast={onToast}
      />
    </div>
  );
}
