import {Router} from "express";
import { sendMessage } from "../controllers/whatsapp.controller.js";
import {authenticateAdmin} from "../middleware/verifyJWT.js";

const whatsappRouter = Router();

whatsappRouter.route("/sendMessage").post(authenticateAdmin,sendMessage);

export {
    whatsappRouter
}