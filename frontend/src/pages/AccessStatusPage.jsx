import { AlertCircle, Clock3, LogOut, ShieldCheck } from "lucide-react";

export default function AccessStatusPage({
  user,
  status,
  error,
  onRetry,
  onSignOut,
}) {
  const isPending = status === "pending" || status === "checking";
  const heading =
    status === "rejected"
      ? "Access not approved"
      : status === "error"
        ? "We could not verify access"
        : status === "checking"
          ? "Checking workspace access"
          : "Request sent";

  return (
    <main className="ledger-access-page">
      <section className="ledger-access-panel" aria-labelledby="access-title">
        <span className="ledger-access-icon">
          {status === "error" ? (
            <AlertCircle size={22} />
          ) : isPending ? (
            <Clock3 size={22} />
          ) : (
            <ShieldCheck size={22} />
          )}
        </span>
        <p className="ledger-small-label">FAMILY LEDGER ACCESS</p>
        <h1 id="access-title">{heading}</h1>
        <p className="ledger-access-copy">
          {status === "checking"
            ? "Your Google account is being checked."
            : status === "pending"
              ? `Access for ${user?.email} is waiting for approval from the administrator.`
              : status === "rejected"
                ? `The administrator has not approved ${user?.email} for this workspace.`
                : error ||
                  "Try checking again, or contact the workspace administrator."}
        </p>
        {error && (
          <p className="ledger-access-error" role="alert">
            {error}
          </p>
        )}
        <p className="ledger-access-admin">
          Administrator: <strong>ramosraf278@gmail.com</strong>
        </p>
        <div className="ledger-access-actions">
          {status === "error" && (
            <button className="ledger-button primary" onClick={onRetry}>
              Check again
            </button>
          )}
          <button className="ledger-button secondary" onClick={onSignOut}>
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
