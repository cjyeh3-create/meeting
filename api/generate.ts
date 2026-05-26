import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Handle CORS and preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { transcript, format, tone, language, customPrompt, provider } = req.body;

    if (!transcript || typeof transcript !== "string") {
      return res.status(400).json({ error: "請貼上會議逐字稿或重點筆記後再執行。" });
    }

    const langNames: Record<string, string> = {
      "en": "英文",
      "ja": "日文",
      "ko": "韓文",
      "zh-TW": "繁體中文",
      "zh-CN": "簡體中文"
    };
    const displayLang = langNames[language as string] || "英文";

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

    const systemInstruction = `你是一位專業的會議記錄助理。請根據使用者提供的會議逐字稿，整理出結構化的會議紀錄。
請務必遵守以下輸出格式要求：

1. **會議主題與時間**：擷取會議的主題與時間。
2. **與會者**：列出參與會議的人員。
3. **會議重點總結**：用 3 到 5 個重點總結會議內容。
4. **Action Items (待辦事項)**：明確列出接下來的待辦事項與負責人。
5. **${displayLang}翻譯版**：將上述 1~4 點的內容完整翻譯成專業的${displayLang}。

請以 Markdown 格式輸出，所有繁體中文部分必須使用**繁體中文**回覆，不要包含任何額外的問候語或結語。`;

    let summaryText = "";

    if (provider === "nvidia") {
      const nvidiaKey = process.env.NVIDIA_API_KEY;
      if (!nvidiaKey) {
        return res.status(500).json({
          error: "未偵測到 NVIDIA_API_KEY。請設定該環境變數後再試。"
        });
      }

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${nvidiaKey}`
        },
        body: JSON.stringify({
          model: "nvidia/nemotron-mini-4b-instruct",
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: promptText }
          ],
          temperature: 0.25
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `NVIDIA API 錯誤，狀態碼: ${response.status}`);
      }

      const data = await response.json();
      summaryText = data.choices?.[0]?.message?.content || "";
    } else {
      // Default to Google Gemini (gemini-2.5-flash-lite)
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(500).json({
          error: "未偵測到 GEMINI_API_KEY。請至設定中配置環境變數。"
        });
      }

      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptText,
        config: {
          systemInstruction,
          temperature: 0.25
        }
      });

      summaryText = response.text || "";
    }

    if (!summaryText) {
      throw new Error("AI 服務商未傳回有效內容，請重試或更換服務商。");
    }

    res.json({ result: summaryText });
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ error: error.message || "伺服器處理時發生系統錯誤" });
  }
}
