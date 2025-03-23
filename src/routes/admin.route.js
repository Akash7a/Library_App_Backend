import { Router } from "express";
import {authenticateAdmin} from "../middleware/verifyJWT.js";

import{
    registerAdmin,
    loginAdmin,
    adminLogout,
    adminProfile,
} 
from "../controllers/admin.controller.js";
import upload from "../middleware/multer.js";

const adminRouter = Router();

adminRouter.route("/register").post(upload.single('profilePic'),registerAdmin);
adminRouter.route("/login").post(loginAdmin);
adminRouter.route("/logout").get(authenticateAdmin,adminLogout);
adminRouter.route("/getProfile").get(authenticateAdmin,adminProfile);

export {
    adminRouter
}