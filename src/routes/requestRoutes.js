import { Router } from "express";
import { createRequest } from "../controllers/requestController.js";

const router = Router();
router.post("/", createRequest);
export default router;