import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listRequests, updateRequestStatus, pendingProperties,
  approveProperty, toggleFeatured, deleteProperty, exportRequestsCsv
} from "../controllers/adminController.js";

const router = Router();
router.use(requireAuth);

router.get("/requests/export-csv", exportRequestsCsv);
router.get("/requests", listRequests);
router.patch("/requests/:id/status", updateRequestStatus);

router.get("/properties/pending", pendingProperties);
router.patch("/properties/:id/approve", approveProperty);
router.patch("/properties/:id/featured", toggleFeatured);
router.delete("/properties/:id", deleteProperty);

export default router;