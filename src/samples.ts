import { SampleTemplate } from "./types";

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: "global-sync",
    title: "跨國技術團隊週會 (英文逐字稿)",
    icon: "💻",
    badge: "翻譯+總結首選",
    description: "模擬跨國科技團隊的英文對話，包含伺服器負載、前端介面與行銷追蹤的時程同步，測試翻譯繁中及行動事項整理。",
    content: `Sarah (Project Manager): Okay, everyone, let's start our weekly sync-up. First off, regarding the new payment system integration. Jack, how is the database migration going?

Jack (Backend Dev): Hi Sarah, we encountered some latency spikes with Cloud Spanner yesterday during peak simulation, but I've optimized the query indexes. The average write delay is down to 45ms. We are ready to deploy to the staging environment by Thursday morning.

Sarah: Excellent. What about the frontend checkout interface? Lucy?

Lucy (Frontend Dev): The checkout UI is 95% complete with accessibility landmarks. However, we're still waiting on the final Apple Pay developer certificate from the legal team. If we don't get it by Wednesday afternoon, it might delay our user acceptance testing (UAT).

Sarah: Got it. I'll ping the legal department right after this meeting to expedite. In the meantime, Lucy, can you continue with the backup Stripe configuration?

Lucy: Sure, I can set up the webhook listeners today.

Sarah: Perfect. Mike, any updates from marketing?

Mike (Marketing Manager): Yes! The landing page campaign is ready. We plan to launch it next Monday. But we need the final registration API endpoint from Jack by Friday morning so our tracking pixels can trace registration success properly.

Jack: No problem, Mike. I'll provide the staging endpoint by Thursday afternoon.

Sarah: Thanks everyone! Let's follow up on Slack.`,
    defaultFormat: "action_items",
    defaultTone: "professional"
  },
  {
    id: "filler-cleanup",
    title: "APP 改版痛點討論 (口語雜亂逐字稿)",
    icon: "🎨",
    badge: "去蕪存菁測試",
    description: "口語化論述，夾雜著語無倫次、重複詞彙與贅詞（例如：呃、那那個、然後、對對對），考驗 AI 精煉重點能力。",
    content: `阿明 (產品經理)：呃，那個...我們今天來討論一下那個新版行動端 APP 的首頁改版。就是說，那個，對，我們現在的首頁資訊，使用者昨天在線上回饋說找不到搜尋按鈕。我覺得啦，應該要把搜尋框放大，然後移到最上面，大家覺得呢？

小華 (UI/UX 設計師)：嗯...那如果是這樣的話，原本下面的精選廣告看板區（banner）可能要被迫等比例縮小。可是行銷部那邊...呃...不知道會不會有意見，因為他們之前一直強調需要足夠的曝光率去推下個月的端午節合作案。然後，我昨天有畫一個草稿，是搜尋框直接改成常駐在最頂端，在滑動的時候把它縮乾淨，這樣就能兼顧搜尋方便跟 Banner 的尺寸，你們覺得這樣可行嗎？

小強 (前端工程師)：那個，滑動把搜尋框縮到最頂端是沒問題啦，但是這樣我們的導覽列（header）就必須要做大微調，因為有 CSS sticky 設定的衝突。這部分大概需要 1.5 個工作天來整理，如果需要額外做淡入淡出動畫效果的話。

阿明：好...好好。那就這樣定案。小華你今天下班前把那個 Figma 設計稿微調好丟到討論群組。小強你就等拿到 Figma 後，明天開始動工，目標是這週五下班前發去測試機，可以吧？

小強：應該可以，但大前提是先確定行銷部那邊沒有反對 Banner 縮小的提案。如果他們反彈，我們又白做了。

阿明：行銷部那邊，呃，我等一下午餐開會會去跟他們總監談看看，如果不行我再在 Slack 上面 @ 大家。今天先這樣。`,
    defaultFormat: "detailed",
    defaultTone: "casual"
  },
  {
    id: "rough-notes",
    title: "夏季行銷推廣計畫 (隨手重點筆記)",
    icon: "📝",
    badge: "結構化重組",
    description: "凌亂、非對話式的隨手速記，展示 AI 如何將支離破碎的片段，組合成商務高管等級的正式結構簡報。",
    content: `2026年夏季行銷企劃 A
- 目標：提升新加入會員 250%，APP 下載量破萬
- 預算：50萬台幣上限跑 3 個月
- 行銷管道：IG/Threads 短影音、FB社團團購，還有少部分 Google Ads
- 起迄時程：預估 6/15 開始起跑跑 3 個月至 9/15
- 目前痛點：合適的 IG 網紅名單還沒整理好，大家推薦找誰？（小李之前提過找科技或生活類的微網紅）
- 會中決議與任務分派：
  1. 小李負責列出 10 位科技、生活、3C 領域，萬人追蹤上下的微網紅名單，這週五交
  2. 小張去聯絡影音製作團隊，拍一個 30s 宣傳廣告片，下週二開會要看腳本初稿
  3. 預估下次會議 (下週二) 之前，每個人都要對協作文件給反饋意見，不限形式`,
    defaultFormat: "bullet",
    defaultTone: "concise"
  }
];
