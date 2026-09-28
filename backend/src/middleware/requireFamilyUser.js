const {
  createUserClient,
  isSupabaseConfigured,
} = require("../config/supabase");

const adminEmail = "ramosraf278@gmail.com";

async function requireFamilyUser(request, response, next) {
  if (!isSupabaseConfigured()) {
    return response.status(503).json({
      error: "Backend Supabase configuration is missing.",
    });
  }

  const accessToken = request
    .get("authorization")
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) {
    return response
      .status(401)
      .json({ error: "A Supabase access token is required." });
  }

  try {
    const supabase = createUserClient(accessToken);
    const { data, error } = await supabase.auth.getUser(accessToken);
    if (error || !data.user) {
      return response
        .status(401)
        .json({ error: "The Supabase session is invalid or expired." });
    }

    const isAdmin = data.user.email?.trim().toLocaleLowerCase() === adminEmail;
    if (!isAdmin) {
      const { data: accessRequest, error: accessError } = await supabase
        .from("access_requests")
        .select("status")
        .eq("user_id", data.user.id)
        .maybeSingle();

      if (accessError || accessRequest?.status !== "approved") {
        return response.status(403).json({
          error:
            "This Google account has not been approved for the family ledger.",
        });
      }
    }

    request.supabase = supabase;
    request.user = data.user;
    return next();
  } catch (error) {
    return response.status(502).json({ error: error.message });
  }
}

module.exports = { requireFamilyUser };
