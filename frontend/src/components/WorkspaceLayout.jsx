import { Clock3, RefreshCw } from "lucide-react";
import AppSidebar from "./AppSidebar.jsx";
import DashboardSkeleton from "./DashboardSkeleton.jsx";
import { pageTitles } from "../logic/ledger.js";
import { supabaseConfigured } from "../services/supabase.js";

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
  children,
}) {
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
            <div>
              <h1>{pageTitles[page]}</h1>
            </div>
            <div className="ledger-controls">
              <label className="ledger-select-label" htmlFor="period-select">
                <Clock3 size={14} />
                <select
                  id="period-select"
                  value={ledger.periodSelection}
                  onChange={(event) => ledger.setPeriod(event.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 days</option>
                  <option value="month">This month</option>
                  <option value="all">All time</option>
                  <option value="date">Select date</option>
                  <option value="custom">Custom range</option>
                </select>
              </label>
              {ledger.periodSelection === "date" && (
                <div className="ledger-date-range">
                  <label className="ledger-date-field">
                    <span>Date</span>
                    <input
                      aria-label="Selected date"
                      type="date"
                      value={ledger.selectedDate}
                      onChange={(event) =>
                        ledger.setSelectedDate(event.target.value)
                      }
                    />
                  </label>
                </div>
              )}
              {ledger.periodSelection !== "all" &&
                ledger.periodSelection !== "date" && (
                  <div className="ledger-date-range">
                    <label className="ledger-date-field">
                      <span>From</span>
                      <input
                        aria-label="Start date"
                        type="date"
                        value={ledger.startDate}
                        disabled={ledger.periodSelection !== "custom"}
                        onChange={(event) =>
                          ledger.setStartDate(event.target.value)
                        }
                      />
                    </label>
                    <label className="ledger-date-field">
                      <span>To</span>
                      <input
                        aria-label="End date"
                        type="date"
                        value={ledger.endDate}
                        disabled={ledger.periodSelection !== "custom"}
                        onChange={(event) =>
                          ledger.setEndDate(event.target.value)
                        }
                      />
                    </label>
                  </div>
                )}
              {ledger.periodSelection === "all" && (
                <span className="ledger-all-dates">All dates</span>
              )}
            </div>
          </div>

          {ledger.isLoading ? <DashboardSkeleton /> : children}

          <div className="ledger-workspace-footer">
            <span role="status">{syncStatus}</span>
            <div className="ledger-footer-actions">
              {supabaseConfigured && (
                <button
                  className="ledger-refresh-button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                >
                  <RefreshCw
                    size={13}
                    className={isSyncing ? "spinning" : ""}
                  />{" "}
                  Sync now
                </button>
              )}
              <button
                className="ledger-refresh-button"
                onClick={ledger.refresh}
                disabled={ledger.isLoading}
              >
                <RefreshCw
                  size={13}
                  className={ledger.isLoading ? "spinning" : ""}
                />{" "}
                Simulate slow connection
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
