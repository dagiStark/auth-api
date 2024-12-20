import express from "express";
import validateResource from "../middleware/validateResource";
import { createSessionSchema } from "../schema/auth.schema";
import {
  createSessionHandler,
  refreshAccessTokenHandler,
} from "../controller/auth.controller";

const router = express.Router();

router.post(
  "/api/sessions",
  validateResource(createSessionSchema),
  createSessionHandler
);

router.post("/api/session/refresh", refreshAccessTokenHandler);

export default router;
