const express = require("express");
const { userAuthMiddleware } = require("../middlewares/userAuth.middleware");
const {
  createReport,
  getReports,
  sendReportNow,
  updateReport,
  deleteReport,
} = require("../controllers/ReportControllers/report.controller");
const router = express.Router();

router.get("/", userAuthMiddleware, getReports);
router.post("/", userAuthMiddleware, createReport);
router.post("/send", userAuthMiddleware, sendReportNow);
router.put("/:id", userAuthMiddleware, updateReport);
router.delete("/:id", userAuthMiddleware, deleteReport);

module.exports = router;
