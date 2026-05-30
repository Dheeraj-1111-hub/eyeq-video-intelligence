import { Router } from "express";
import { 
  createCase, 
  getCases, 
  getCaseDetails, 
  addEvidence, 
  addNote,
  generateReport, 
  getReportPreview,
  updateCaseStatus 
} from "../controllers/case.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// Protect all case routes
router.use(requireAuth);

router.post("/", createCase);
router.get("/", getCases);
router.get("/:id", getCaseDetails);
router.put("/:id", updateCaseStatus);
router.post("/:id/evidence", addEvidence);
router.post("/:id/notes", addNote);
router.get("/:id/report/preview", getReportPreview);
router.get("/:id/report", generateReport); // Using GET so we can trigger standard downloads

export default router;
