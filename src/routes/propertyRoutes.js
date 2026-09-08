import { Router } from "express";
import multer from "multer";
import { createProperty, getProperty, listPublished, uploadPropertyImages } from "../controllers/propertyController.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    cb(null, /^image\/(jpeg|png|webp|avif)$/i.test(file.mimetype));
  }
});

router.get("/", listPublished);
router.get("/:id", getProperty);
router.post("/", createProperty);
router.post("/images", upload.array("images", 10), uploadPropertyImages);

export default router;