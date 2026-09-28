import { Link } from "react-router-dom";
import { Check, Menu, Wallet, X } from "lucide-react";
import AppRoutes from "./routes/AppRoutes.jsx";
import { useAppShell } from "./hooks/useAppShell.js";
import "./App.css";

function Brand({ to }) {
  return (
    <Link className="ledger-brand" to={to} aria-label="Family Ledger home">
      <span className="ledger-brand-mark">
        <Wallet size={18} strokeWidth={2.2} />
      </span>
      <span>
        Family Ledger
        <span className="ledger-brand-subtitle">Shared business book</span>
      </span>
    </Link>
  );
}

export default function AppRoot() {
  const {
    page,
    ledger,
    sidebarOpen,
    setSidebarOpen,
    toast,
    authUser,
    authLoading,
    syncStatus,
    isSyncing,
    accessStatus,
    accessError,
    navigateToPage,
    handleGoogleSignIn,
    handleSignOut,
    handleSyncNow,
    retryAccessCheck,
    googleConfigured,
    demoMode,
  } = useAppShell();

  return (
    <div className="ledger-app min-h-screen">
      <header className="ledger-topbar">
        <div className="ledger-topbar-start">
          {page !== null && (
            <button
              className="ledger-menu-button"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={
                sidebarOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          )}
          <Brand to={authUser ? "/app" : "/"} />
        </div>
        {page !== null ? (
          authUser ? null : (
            <div className="ledger-topbar-end">
              <span className="ledger-preview-mode">
                <span /> Preview mode
              </span>
            </div>
          )
        ) : (
          <nav className="ledger-topnav" aria-label="Main navigation">
            <a href="#businesses">Businesses</a>
            <a href="#how-it-works">About</a>
            <button
              className="ledger-button primary top-action"
              onClick={handleGoogleSignIn}
            >
              <span className="ledger-google-mark">G</span> Continue with Google
            </button>
          </nav>
        )}
      </header>

      <AppRoutes
        ledger={ledger}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNavigate={navigateToPage}
        onSignOut={handleSignOut}
        onGoogle={handleGoogleSignIn}
        googleConfigured={googleConfigured}
        demoMode={demoMode}
        authUser={authUser}
        authLoading={authLoading}
        accessStatus={accessStatus}
        accessError={accessError}
        onRetryAccessCheck={retryAccessCheck}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        onSyncNow={handleSyncNow}
      />

      {toast && (
        <div className="ledger-toast" role="status">
          <Check size={15} />
          {toast}
        </div>
      )}
    </div>
  );
}
