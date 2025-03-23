import puppeteer from "puppeteer";
import path from "path";

const __dirname = path.resolve();
let browserInstance; // Store the browser instance to prevent multiple openings

export const openWhatsApp = async () => {
    try {
        if (browserInstance) {
            console.log("⚡ WhatsApp is already running.");
            return { success: true, message: "WhatsApp is already open." };
        }

        console.log("📱 Opening WhatsApp Web...");

        // ✅ Launch browser with persistent session
        browserInstance = await puppeteer.launch({
            headless: false,
            userDataDir: path.join(__dirname, "whatsapp-session"),
        });

        const pages = await browserInstance.pages();
        const page = pages.length ? pages[0] : await browserInstance.newPage();

        // ✅ Load WhatsApp Web
        await page.goto("https://web.whatsapp.com", { waitUntil: "domcontentloaded" });

        // ✅ Wait for the main chat container to load
        await page.waitForSelector("div[role='grid']", { timeout: 60000 });

        console.log("✅ WhatsApp Web is open and ready.");

        // 🛑 Detect when the user closes the browser manually
        browserInstance.on("disconnected", () => {
            console.log("❌ WhatsApp Web was closed manually.");
            browserInstance = null; // Reset the instance
        });

        return { success: true, message: "WhatsApp Web opened successfully." };

    } catch (error) {
        console.error("❌ Error opening WhatsApp Web:", error);
        browserInstance = null; // Reset if error occurs
        return { success: false, error: error.message };
    }
};
export const sendWhatsAppMessage = async (number, message) => {
    try {
        if (!browserInstance) {
            throw new Error("WhatsApp Web is not open. Please start it first.");
        }

        const pages = await browserInstance.pages();
        const page = pages.length ? pages[0] : await browserInstance.newPage();

        // ✅ Open chat with the number
        await page.goto(`https://web.whatsapp.com/send?phone=${number}`, { waitUntil: "domcontentloaded" });

        // ✅ Wait for the message input box to appear
        await page.waitForSelector("div[contenteditable='true'][data-tab='10']", { timeout: 60000 });

        // ✅ Select the correct message input field
        const inputBox = await page.$("div[contenteditable='true'][data-tab='10']");

        if (!inputBox) {
            throw new Error("Message input box not found!");
        }

        // ✅ Focus on the input box
        await inputBox.focus();

        // ✅ Type the message like a real user
        await page.type("div[contenteditable='true'][data-tab='10']", message, { delay: 100 });

        // ✅ Press "Enter" to send the message
        await page.keyboard.press("Enter");

        console.log(`✅ Message sent to ${number}`);
        return { success: true, message: "Message sent successfully." };

    } catch (error) {
        console.error("❌ Error sending message:", error);
        throw new Error(error.message);
    }
};