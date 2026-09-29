import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getPageFromPath } from "../routes/pageFromPath.js";
import { useDemoLedger } from "./useDemoLedger.js";
import { useAccessControl } from "./useAccessControl.js";
import { supabase, supabaseConfigured } from "../services/supabase.js";
import {
  pullFromSupabase,
  syncLocalLedgerToSupabase,
} from "../services/ledgerSync.js";

export function useAppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = getPageFromPath(location.pathname);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [syncStatus, setSyncStatus] = useState(
    supabaseConfigured
      ? "Sign in to sync this browser's data."
      : "Preview data is saved only in this browser.",
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const { accessStatus, accessError, retryAccessCheck } =
    useAccessControl(authUser);
  const hasWorkspaceAccess =
    accessStatus === "approved" || accessStatus === "admin";
  const ledger = useDemoLedger(page ?? "overview");

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setAuthUser(data.session?.user ?? null);
        setAuthLoading(false);
      }
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!authUser || !hasWorkspaceAccess) return undefined;

    let active = true;
    pullFromSupabase()
      .then((result) => {
        if (active && result) {
          setSyncStatus(
            `Connected to Supabase (${result.entryCount} entries in cloud).`,
          );
        }
      })
      .catch((error) => {
        if (active) setSyncStatus(`Supabase sync check: ${error.message}`);
      })
      .finally(() => {
        if (active) setIsSyncing(false);
      });

    return () => {
      active = false;
    };
  }, [authUser, hasWorkspaceAccess]);

  useEffect(() => {
    if (!authUser || accessStatus === "checking") return;
    if (location.pathname === "/") {
      navigate(hasWorkspaceAccess ? "/app" : "/access", { replace: true });
    } else if (location.pathname === "/access" && hasWorkspaceAccess) {
      navigate("/app", { replace: true });
    }
  }, [accessStatus, authUser, hasWorkspaceAccess, location.pathname, navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigateToPage = (targetPage) => {
    if (targetPage === "overview") navigate("/app");
    else if (targetPage === "inventory") navigate("/app/inventory");
    else if (targetPage === "admin") navigate("/app/admin");
    else navigate(`/app/business/${targetPage}`);
    setSidebarOpen(false);
  };

  const handleGoogleSignIn = async () => {
    if (!supabase) {
      setToast(
        "Supabase is not configured. Check the frontend environment settings.",
      );
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/app` },
    });
    if (error) setToast(`Google sign-in could not start: ${error.message}`);
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) setToast(`Sign-out failed: ${error.message}`);
    else navigate("/");
  };

  const handleSyncNow = async () => {
    if (!hasWorkspaceAccess) {
      setSyncStatus(
        "Workspace access is required to sync this browser's data.",
      );
      return;
    }

    setIsSyncing(true);
    setSyncStatus("Syncing local data to Supabase…");
    try {
      const result = await syncLocalLedgerToSupabase();
      if (result) {
        setSyncStatus(
          `Synced ${result.entryCount} activity entries, ${result.ingredientCount} ingredients, and ${result.purchaseCount} purchases to Supabase.`,
        );
      }
    } catch (error) {
      setSyncStatus(`Supabase sync failed: ${error.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    page,
    ledger,
    sidebarOpen,
    setSidebarOpen,
    toast,
    setToast,
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
    googleConfigured: supabaseConfigured,
    demoMode: !supabaseConfigured,
  };
}
