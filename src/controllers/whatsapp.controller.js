import { sendWhatsAppMessage,openWhatsApp } from "../utils/whatsapp.js";

export const sendMessage = async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!number || !message) {
            return res.status(400).json({ success: false, message: "Contact and message is required" });
        }

        const result = await openWhatsApp();
        console.log(result.message);

        const sendResult = await sendWhatsAppMessage(number, message);
        res.json({ sendResult, message: "Message sent successfully" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
}