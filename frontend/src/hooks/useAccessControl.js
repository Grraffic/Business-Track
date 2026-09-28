import { useEffect, useState } from "react";
import { isLedgerAdmin } from "../logic/access.js";
import { supabase } from "../services/supabase.js";

export function useAccessControl(user) {
  const [resolvedAccess, setResolvedAccess] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user || isLedgerAdmin(user)) return undefined;

    let active = true;

    const checkAccess = async () => {
      if (!supabase) {
        setResolvedAccess({
          userId: user.id,
          status: "error",
          error: "Supabase access control is not configured.",
        });
        return;
      }

      const { data: existingRequest, error: requestError } = await supabase
        .from("access_requests")
        .select("status")
        .eq("user_id", user.id)
        .maybeSingle();

      if (requestError) {
        if (active) {
          setResolvedAccess({
            userId: user.id,
            status: "error",
            error: requestError.message,
          });
        }
        return;
      }

      if (existingRequest) {
        if (active) {
          setResolvedAccess({
            userId: user.id,
            status: existingRequest.status,
            error: "",
          });
        }
        return;
      }

      const { data: newRequest, error: insertError } = await supabase
        .from("access_requests")
        .insert({
          user_id: user.id,
          email: user.email,
          status: "pending",
        })
        .select("status")
        .single();

      if (insertError) {
        if (active) {
          setResolvedAccess({
            userId: user.id,
            status: "error",
            error: insertError.message,
          });
        }
        return;
      }

      if (active) {
        setResolvedAccess({
          userId: user.id,
          status: newRequest.status,
          error: "",
        });
      }
    };

    checkAccess().catch((error) => {
      if (active) {
        setResolvedAccess({
          userId: user.id,
          status: "error",
          error: error.message || "Could not check workspace access.",
        });
      }
    });

    return () => {
      active = false;
    };
  }, [user, retryCount]);

  const accessStatus = !user
    ? "signed-out"
    : isLedgerAdmin(user)
      ? "admin"
      : resolvedAccess?.userId === user.id
        ? resolvedAccess.status
        : "checking";
  const accessError =
    user && resolvedAccess?.userId === user.id
      ? (resolvedAccess.error ?? "")
      : "";

  return {
    accessStatus,
    accessError,
    retryAccessCheck: () => setRetryCount((count) => count + 1),
  };
}
