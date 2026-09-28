import { useEffect, useState } from "react";
import { isLedgerAdmin } from "../logic/access.js";
import { supabase } from "../services/supabase.js";

export function useAdminAccess(user) {
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!user || !isLedgerAdmin(user) || !supabase) return undefined;

    let active = true;
    supabase
      .from("access_requests")
      .select("id,user_id,email,status,requested_at,reviewed_at")
      .order("requested_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        else {
          setRequests(data ?? []);
          setError("");
        }
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user, retryCount]);

  const reviewRequest = async (request, status) => {
    if (!supabase || !isLedgerAdmin(user)) return;
    setWorkingId(request.id);
    setError("");
    setNotice("");

    const { data, error: updateError } = await supabase
      .from("access_requests")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq("id", request.id)
      .select("id,user_id,email,status,requested_at,reviewed_at")
      .single();

    if (updateError) {
      setError(updateError.message);
    } else {
      setRequests((current) =>
        current.map((item) => (item.id === data.id ? data : item)),
      );
      setNotice(
        `${data.email} ${status === "approved" ? "approved" : "rejected"}.`,
      );
    }
    setWorkingId(null);
  };

  const visibleRequests = requests.filter(
    (request) => request.status === statusFilter,
  );

  return {
    requests,
    visibleRequests,
    statusFilter,
    setStatusFilter,
    isLoading,
    workingId,
    error,
    notice,
    refreshRequests: () => {
      setIsLoading(true);
      setRetryCount((count) => count + 1);
    },
    reviewRequest,
  };
}
