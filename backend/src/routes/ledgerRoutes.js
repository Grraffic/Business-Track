const express = require("express");
const { syncLocalLedger } = require("../controllers/ledgerController");
const { requireFamilyUser } = require("../middleware/requireFamilyUser");

const router = express.Router();

router.post("/sync", requireFamilyUser, syncLocalLedger);

module.exports = router;
