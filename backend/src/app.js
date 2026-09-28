const cors = require("cors");
const express = require("express");
const { isSupabaseConfigured } = require("./config/supabase");
const ledgerRoutes = require("./routes/ledgerRoutes");

const app = express();
const allowedOrigins = (
  process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((origin) => origin.trim());

app.use(
  cors({
    origin(origin, callback) {
      const localDevelopmentOrigin =
        process.env.NODE_ENV !== "production" &&
        /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        localDevelopmentOrigin
      ) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS."));
    },
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    supabaseConfigured: isSupabaseConfigured(),
  });
});

app.use("/api/ledger", ledgerRoutes);

app.use((error, _request, response, _next) => {
  response
    .status(500)
    .json({ error: error.message || "Internal server error." });
});

module.exports = app;
