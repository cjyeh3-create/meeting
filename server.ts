import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set standard body parser limit to support very large meeting transcripts
  app.use(express.json({ limit: "15mb" }));

  // API Route - Meeting Summarizer and Translator
  app.post("/api/summarize", async (req, res) => {
    try {
      const { transcript, format, tone, language, customPrompt } = req.body;

      if (!transcript || typeof transcript !== "string") {
        return res.status(400).json({ error: "請貼上會議逐字稿或重點筆記後再執行。" });
      }

      const key = process.env.GEMINI_API_KEY;
      if (!key) {
        return res.status(500).json({
          error: "未偵測到 GEMINI_API_KEY。請至 AI Studio 介面的 設定 > 金鑰 (Settings > Secrets) 中設定。"
        });
      }

      // Initialize the modern GoogleGenAI client with headers per skill guidelines
      const ai = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      // Prepare contextual directives based on format
      let formatGuide = "";
      if (format === "bullet") {
        formatGuide = "- 請生成『一目了然條列式總結』，包含：會議核心主旨、關鍵討論主題表格與結論，以及五個最關鍵的重點點出。";
      } else if (format === "detailed") {
        formatGuide = "- 請生成『詳細會議紀要』，包含：會議背景、逐項詳細議題讨论（記錄發言觀點與過程）、最後全體決議以及待續處理事項。";
      } else if (format === "action_items") {
        formatGuide = "- 請生成『行動與待辦與追蹤事項清單』，請以 Markdown 核取清單 `- [ ]` 形式條列：具體任務描述、指向明確的負責人、預期進度或截止時程。並建立一個小表格來匯整所有行動事項。";
      } else if (format === "digest") {
        formatGuide = "- 請生成『會議精華摘要與核心回顧』，包含：一語以蔽之、核心痛點/成果、未來下一步戰略規劃。";
      }

      let toneGuide = "請使用專業經理人的商務口吻。";
      if (tone === "casual") {
        toneGuide = "請使用輕鬆、友善、自然但清晰得體的口吻。";
      } else if (tone === "concise") {
        toneGuide = "請極度簡明扼要，直指重點核心結構，完全排除多餘的客套與修飾詞，精煉句子。";
      }

      const langNames: Record<string, string> = {
        "en": "英文",
        "ja": "日文",
        "ko": "韓文",
        "zh-TW": "繁體中文",
        "zh-CN": "簡體中文"
      };
      const displayLang = langNames[language as string] || "英文";

      const promptText = `請針對以下提供的會議記錄或筆記進行分析、總結、摘錄與優質翻譯。
產出格式精美、結構嚴謹且好讀的 Markdown 報告。

[格式配置要求]
${formatGuide}
${toneGuide}
${customPrompt ? `[額外自訂提示/背景指令]：${customPrompt}` : ""}

--- 會議原始文字開始 ---
${transcript}
--- 會議原始文字結束 ---

請立即產出 Markdown 格式的完整會議總結與翻譯報告。`;

      // Use basic text task model per gemini-api skill guide: gemini-3.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction: `你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。
2. **與會者**：列出參與會議的人員。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **${displayLang}翻譯版**：將上述 1~4 點的內容完整翻譯成專業的${displayLang}。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。`,
          temperature: 0.25
        }
      });

      // Extract text content safely using property per skill instructions
      const summaryText = response.text || "無法生成總結。請檢查您的輸入或是 API 回應是否異常。";
      res.json({ result: summaryText });
    } catch (error: any) {
      console.error("Express API error:", error);
      res.status(500).json({ error: error.message || "伺服器處理會議摘要與翻譯時發生系統錯誤" });
    }
  });

  // Serve Frontend with Vite Middleware in Development, statically in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] 會議總結後端已啟動於：http://localhost:${PORT}`);
  });
}

startServer();
