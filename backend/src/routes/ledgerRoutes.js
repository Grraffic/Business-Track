const express = require("express");
const { syncLocalLedger, clearLocalLedger } = require("../controllers/ledgerController");
const { requireFamilyUser } = require("../middleware/requireFamilyUser");

const router = express.Router();

router.post("/sync", requireFamilyUser, syncLocalLedger);
router.delete("/clear", requireFamilyUser, clearLocalLedger);

module.exports = router;
