import {
  Archive,
  BarChart3,
  Cookie,
  Droplets,
  LogOut,
  ShieldCheck,
  Snowflake,
} from "lucide-react";
import { isLedgerAdmin } from "../logic/access.js";

const navigation = [{ label: "Overview", id: "overview", icon: BarChart3 }];

const businesses = [
  { label: "Water", id: "water", icon: Droplets },
  { label: "Ice", id: "ice", icon: Snowflake },
  { label: "Graham Bar", id: "graham", icon: Cookie },
];

export default function AppSidebar({
  activePage,
  authUser,
  onSignOut,
  onNavigate,
  isOpen,
}) {
  const accountLabel = authUser?.email ?? "Preview account";
  const accountInitials = authUser?.email?.slice(0, 2).toUpperCase() ?? "EK";

  const renderLink = ({ id, label, icon: Icon }) => (
    <button
      className={`ledger-side-link ${activePage === id ? "active" : ""}`}
      key={id}
      onClick={() => onNavigate(id)}
      aria-current={activePage === id ? "page" : undefined}
    >
      <Icon size={16} strokeWidth={1.8} />
      <span>{label}</span>
    </button>
  );

  return (
    <aside
      className={`ledger-sidebar ${isOpen ? "open" : ""}`}
      aria-label="Workspace navigation"
    >
      <p className="ledger-sidebar-label">WORKSPACE</p>
      <div className="ledger-side-group">{navigation.map(renderLink)}</div>
      <p className="ledger-sidebar-label">BUSINESSES</p>
      <div className="ledger-side-group">{businesses.map(renderLink)}</div>
      <p className="ledger-sidebar-label">MANAGE</p>
      <div className="ledger-side-group">
        {renderLink({ label: "Graham stock", id: "inventory", icon: Archive })}
        {isLedgerAdmin(authUser) &&
          renderLink({
            label: "Access requests",
            id: "admin",
            icon: ShieldCheck,
          })}
      </div>
      <div className="ledger-sidebar-bottom">
        <div className="ledger-member">
          <span className="ledger-avatar">{accountInitials}</span>
          <span className="ledger-member-copy">
            <strong>{accountLabel}</strong>
            <small>{authUser ? "Google account" : "Preview account"}</small>
          </span>
          {authUser && (
            <button
              className="ledger-member-signout"
              type="button"
              aria-label="Sign out"
              title="Sign out"
              onClick={onSignOut}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
