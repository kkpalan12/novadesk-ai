import { Router } from "express";
import { AttachmentController } from "../controllers/attachment.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = Router();
const attachmentController = new AttachmentController();

router.post(
  "/tasks/:taskId/attachments",
  authenticate,
  upload.single("file"),
  (req, _res, next) => {
    console.log("✅ Multer executed");
    console.log(req.file);
    next();
  },
  attachmentController.uploadAttachment,
);

router.get(
  "/tasks/:taskId/attachments",
  authenticate,
  attachmentController.getAttachments,
);

router.delete(
  "/attachments/:id",
  authenticate,
  attachmentController.deleteAttachment,
);

router.get("/attachment-test", (_req, res) => {
  res.send("Attachment Route Working");
});
export default router;
