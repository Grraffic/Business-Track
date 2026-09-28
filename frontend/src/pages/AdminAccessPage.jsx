import { Check, RefreshCw, ShieldCheck, X } from "lucide-react";
import { useAdminAccess } from "../hooks/useAdminAccess.js";

const statusTabs = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];

function formatDate(value) {
  return new Date(value).toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminAccessPage({ user }) {
  const {
    requests,
    visibleRequests,
    statusFilter,
    setStatusFilter,
    isLoading,
    workingId,
    error,
    notice,
    refreshRequests,
    reviewRequest,
  } = useAdminAccess(user);

  return (
    <section
      className="ledger-admin-access"
      aria-labelledby="admin-access-title"
    >
      <div className="ledger-panel ledger-admin-panel">
        <div className="ledger-panel-heading ledger-admin-heading">
          <div>
            <span className="ledger-small-label">WORKSPACE ADMIN</span>
            <h2 id="admin-access-title">Access requests</h2>
            <p>Review Google accounts allowed to use the family ledger.</p>
          </div>
          <button
            className="ledger-icon-link ledger-admin-refresh"
            type="button"
            aria-label="Refresh access requests"
            title="Refresh access requests"
            onClick={refreshRequests}
            disabled={isLoading}
          >
            <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
          </button>
        </div>

        <div className="ledger-admin-toolbar">
          <div
            className="ledger-admin-tabs"
            role="tablist"
            aria-label="Request status"
          >
            {statusTabs.map((tab) => {
              const count = requests.filter(
                (request) => request.status === tab.id,
              ).length;
              return (
                <button
                  className={`ledger-admin-tab ${statusFilter === tab.id ? "active" : ""}`}
                  type="button"
                  role="tab"
                  aria-selected={statusFilter === tab.id}
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                >
                  {tab.label} <span>{count}</span>
                </button>
              );
            })}
          </div>
          <span className="ledger-admin-identity">
            <ShieldCheck size={14} /> {user.email}
          </span>
        </div>

        {error && (
          <p className="ledger-admin-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="ledger-admin-notice" role="status">
            {notice}
          </p>
        )}

        {isLoading ? (
          <p className="ledger-admin-empty" role="status">
            Loading access requests…
          </p>
        ) : visibleRequests.length === 0 ? (
          <p className="ledger-admin-empty">
            No {statusFilter} access requests.
          </p>
        ) : (
          <div className="ledger-admin-list">
            {visibleRequests.map((request) => (
              <article className="ledger-admin-request" key={request.id}>
                <div className="ledger-admin-request-copy">
                  <strong>{request.email}</strong>
                  <span>Requested {formatDate(request.requested_at)}</span>
                  {request.reviewed_at && (
                    <span>Reviewed {formatDate(request.reviewed_at)}</span>
                  )}
                </div>
                <span className={`ledger-admin-status ${request.status}`}>
                  {request.status}
                </span>
                <div className="ledger-admin-actions">
                  {request.status !== "approved" && (
                    <button
                      className="ledger-button primary small"
                      type="button"
                      disabled={workingId === request.id}
                      onClick={() => reviewRequest(request, "approved")}
                    >
                      <Check size={14} /> Approve
                    </button>
                  )}
                  {request.status !== "rejected" && (
                    <button
                      className="ledger-button secondary small"
                      type="button"
                      disabled={workingId === request.id}
                      aria-label={`${request.status === "approved" ? "Revoke access for" : "Reject"} ${request.email}`}
                      onClick={() => reviewRequest(request, "rejected")}
                    >
                      <X size={14} />
                      {request.status === "approved" ? "Revoke" : "Reject"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
