import { Router } from "express";
const router = Router();

import {
  getUser,
  getUsersInfo,
  updateUser,
  updatePassword,
} from "../controllers/user_controllers/index";

// .../user/**
router.get("/getUser", getUser);
router.put("/updateUser", updateUser);
router.put("/updatePassword", updatePassword);

router.post("/getUsersInfo", getUsersInfo);

export default router;
