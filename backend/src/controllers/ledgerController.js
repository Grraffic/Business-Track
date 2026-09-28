const { syncLedger } = require("../services/ledgerSync");

async function syncLocalLedger(request, response) {
  try {
    const result = await syncLedger(
      request.supabase,
      request.user,
      request.body,
    );
    return response.json({ ok: true, ...result });
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}

module.exports = { syncLocalLedger };
