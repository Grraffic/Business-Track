import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import DashboardSkeleton from "../components/DashboardSkeleton.jsx";
import WorkspaceLayout from "../components/WorkspaceLayout.jsx";
import AccessStatusPage from "../pages/AccessStatusPage.jsx";
import AdminAccessPage from "../pages/AdminAccessPage.jsx";
import GrahamPage from "../pages/GrahamPage.jsx";
import IcePage from "../pages/IcePage.jsx";
import IncomeExpenseReportPage from "../pages/IncomeExpenseReportPage.jsx";
import IngredientStockPage from "../pages/IngredientStockPage.jsx";
import LandingPage from "../pages/LandingPage.jsx";
import OverviewPage from "../pages/OverviewPage.jsx";
import RecentSalesPage from "../pages/RecentSalesPage.jsx";
import WaterPage from "../pages/WaterPage.jsx";
import { isLedgerAdmin } from "../logic/access.js";

function AuthenticatedRouteGuard({
  demoMode,
  authUser,
  authLoading,
  accessStatus,
}) {
  if (demoMode) return <Outlet />;

  if (authLoading) {
    return (
      <main className="ledger-content">
        <DashboardSkeleton />
      </main>
    );
  }

  if (!authUser) return <Navigate to="/" replace />;
  if (accessStatus === "checking") {
    return (
      <main className="ledger-content">
        <DashboardSkeleton />
      </main>
    );
  }
  if (accessStatus !== "approved" && accessStatus !== "admin") {
    return <Navigate to="/access" replace />;
  }
  return <Outlet />;
}

export default function AppRoutes({
  ledger,
  sidebarOpen,
  setSidebarOpen,
  onNavigate,
  onSignOut,
  onGoogle,
  googleConfigured,
  demoMode,
  authUser,
  authLoading,
  accessStatus,
  accessError,
  onRetryAccessCheck,
  syncStatus,
  isSyncing,
  onSyncNow,
}) {
  const workspaceProps = (page) => ({
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
  });

  const workspace = (page, content) => (
    <WorkspaceLayout {...workspaceProps(page)}>{content}</WorkspaceLayout>
  );

  return (
    <Routes>
      <Route
        path="/"
        element={
          <LandingPage
            onGoogle={onGoogle}
            googleConfigured={googleConfigured}
          />
        }
      />
      <Route
        path="/access"
        element={
          authUser ? (
            <AccessStatusPage
              user={authUser}
              status={accessStatus}
              error={accessError}
              onRetry={onRetryAccessCheck}
              onSignOut={onSignOut}
            />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        element={
          <AuthenticatedRouteGuard
            demoMode={demoMode}
            authUser={authUser}
            authLoading={authLoading}
            accessStatus={accessStatus}
          />
        }
      >
        <Route
          path="/app/admin"
          element={
            isLedgerAdmin(authUser) ? (
              workspace("admin", <AdminAccessPage user={authUser} />)
            ) : (
              <Navigate to="/app" replace />
            )
          }
        />
        <Route
          path="/app"
          element={workspace(
            "overview",
            <OverviewPage ledger={ledger} onNavigate={onNavigate} />,
          )}
        />
        <Route
          path="/app/report"
          element={workspace(
            "report",
            <IncomeExpenseReportPage
              range={ledger.periodLabel}
              summary={ledger.summary}
              dailyReport={ledger.dailyReport}
            />,
          )}
        />
        <Route
          path="/app/sales"
          element={workspace("sales", <RecentSalesPage sales={ledger.sales} />)}
        />
        <Route
          path="/app/business/water"
          element={workspace("water", <WaterPage period={ledger.period} />)}
        />
        <Route
          path="/app/business/ice"
          element={workspace("ice", <IcePage period={ledger.period} />)}
        />
        <Route
          path="/app/business/graham"
          element={workspace("graham", <GrahamPage period={ledger.period} />)}
        />
        <Route
          path="/app/inventory"
          element={workspace(
            "inventory",
            <IngredientStockPage period={ledger.period} />,
          )}
        />
        <Route path="/app/*" element={<Navigate to="/app" replace />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
