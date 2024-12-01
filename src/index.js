import dotenv from "dotenv";
import { Client } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { QUICK_RESPONSES } from './templates/quickResponses.js';
import { EVAN_PROMPT } from './templates/evanPrompt.js';

dotenv.config();

const mentalAI = new GoogleGenerativeAI(process.env.API_KEY);
const evanModel = mentalAI.getGenerativeModel({ model: "gemini-pro" });

const whatsappBot = new Client();

whatsappBot.on("qr", (qrCode) => {
  qrcode.generate(qrCode, { small: true });
  console.log("Silakan scan QR Code untuk login WhatsApp.");
});

whatsappBot.on("ready", () => {
  console.log("Evan siap membantu! 🌱");
});

whatsappBot.on("message", async (message) => {
  if (message.from.includes("@g.us")) return;

  try {
    const inputMessage = message.body.toLowerCase();
    for (let [trigger, reply] of Object.entries(QUICK_RESPONSES)) {
      if (inputMessage === trigger) {
        await message.reply(reply);
        return;
      }
    }

    if (message.body.startsWith("!ulangi ")) {
      await message.reply(message.body.slice(8));
      return;
    }

    if (message.hasMedia) {
      await message.reply(
        "Maaf, saya hanya dapat melayani pertanyaan berbasis teks."
      );
      return;
    }

    const chatInstance = evanModel.startChat({
      history: [],
      generationConfig: { maxOutputTokens: 300 },
    });

    const aiPrompt = `${EVAN_PROMPT}
Pertanyaan pengguna: ${message.body}`;

    const aiResponse = await chatInstance.sendMessage(aiPrompt);
    const generatedResponse = await aiResponse.response;
    const responseText = generatedResponse.text();

    await message.reply(responseText);
  } catch (error) {
    console.error("Terjadi kesalahan:", error);
    await message.reply(
      "Maaf, ada gangguan teknis. Silakan coba lagi nanti atau hubungi support@layanansehatmental.id untuk bantuan."
    );
  }
});

whatsappBot.initialize();
