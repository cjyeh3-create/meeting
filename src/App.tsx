import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  Sliders,
  Type as FontIcon,
  BookOpen,
  Send,
  AlertCircle,
  HelpCircle,
  FileDown,
  Info
} from "lucide-react";
import { SAMPLE_TEMPLATES } from "./samples";
import { SummaryHistory, SummaryFormat, SummaryTone, SummaryLanguage } from "./types";

export default function App() {
  // Input Transcript state
  const [transcript, setTranscript] = useState<string>("");
  const [format, setFormat] = useState<SummaryFormat>("action_items");
  const [tone, setTone] = useState<SummaryTone>("professional");
  const [language, setLanguage] = useState<SummaryLanguage>("en");
  const [customPrompt, setCustomPrompt] = useState<string>("");

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [result, setResult] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [historyList, setHistoryList] = useState<SummaryHistory[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Result styling state
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg" | "xl">("base");

  // Reassuring loading text loops
  const loadingMessages = [
    "正在上傳並解析會議記錄...",
    "AI 正在消化上下文核心脈絡...",
    "剔除逐字稿贅詞（呃、然後、這個嘛）...",
    "提煉會議共識與分歧要點...",
    "統整跨團隊行動指南、負責人與時程...",
    "正在轉譯為台灣常用商務用語繁體中文...",
    "套用頂級秘書 Markdown 視覺格式..."
  ];

  // Load saved history on startup
  useEffect(() => {
    try {
      const saved = localStorage.getItem("meeting_summary_history");
      if (saved) {
        setHistoryList(JSON.parse(saved));
      }
    } catch (e) {
      console.error("無法載入歷史紀錄：", e);
    }
  }, []);

  // Save history helper
  const saveToHistory = (newSummary: SummaryHistory) => {
    const updated = [newSummary, ...historyList].slice(0, 10); // Keep max 10 records
    setHistoryList(updated);
    try {
      localStorage.setItem("meeting_summary_history", JSON.stringify(updated));
    } catch (e) {
      console.error("無法儲存歷史紀錄：", e);
    }
  };

  // Clear history helper
  const clearHistory = () => {
    if (window.confirm("確定要清除所有歷史紀錄嗎？這項動作無法復原。")) {
      setHistoryList([]);
      localStorage.removeItem("meeting_summary_history");
      setSelectedHistoryId(null);
    }
  };

  // Delete individual history index
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyList.filter(item => item.id !== id);
    setHistoryList(updated);
    try {
      localStorage.setItem("meeting_summary_history", JSON.stringify(updated));
    } catch (err) {
      console.error(err);
    }
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
    }
  };

  // Handle loading steps interval
  useEffect(() => {
    let interval: any = null;
    if (isLoading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    } else {
      setLoadingStep(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading]);

  // Load sample template action
  const applyTemplate = (id: string) => {
    const template = SAMPLE_TEMPLATES.find((t) => t.id === id);
    if (template) {
      setTranscript(template.content);
      setFormat(template.defaultFormat);
      setTone(template.defaultTone);
      setCustomPrompt("");
      setErrorMessage("");
      // Clear output highlight selection
      setSelectedHistoryId(null);
    }
  };

  // Character counter
  const charCount = transcript.length;
  const wordCount = transcript.split(/\s+/).filter(Boolean).length;

  // Form submission handler
  const handleGenerateSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transcript.trim()) {
      setErrorMessage("請先輸入或貼上會議逐字稿、重點筆記再進行生成。");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setResult("");
    setSelectedHistoryId(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          transcript,
          format,
          tone,
          language,
          customPrompt
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "生成失敗，請稍後再試。");
      }

      const generatedMarkdown = data.result;
      setResult(generatedMarkdown);

      // Create a title based on custom metadata or date
      const now = new Date();
      const timeStr = now.toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" });
      const dateStr = now.toLocaleDateString("zh-TW", { month: "2-digit", day: "2-digit" });
      
      const formatLabels: Record<SummaryFormat, string> = {
        bullet: "條列式重點",
        detailed: "詳細紀要",
        action_items: "待辦行動表",
        digest: "精華摘要"
      };

      const title = `${dateStr} 會議總結 (${formatLabels[format]} - ${timeStr})`;

      // Save to localStorage history
      const historyItem: SummaryHistory = {
        id: `${now.getTime()}`,
        title,
        timestamp: `${dateStr} ${timeStr}`,
        originalTextLength: transcript.length,
        format,
        tone,
        language,
        resultMarkdown: generatedMarkdown
      };

      saveToHistory(historyItem);
      setSelectedHistoryId(historyItem.id);
    } catch (err: any) {
      setErrorMessage(err.message || "連線至後端伺服器失敗，請確認伺服器功能已正常啟動。");
    } finally {
      setIsLoading(false);
    }
  };

  // Copy result to clipboard
  const handleCopy = async () => {
    const textToCopy = selectedHistoryId 
      ? historyList.find(h => h.id === selectedHistoryId)?.resultMarkdown || result
      : result;

    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("無法複製文字：", err);
    }
  };

  // Download markdown document file
  const handleDownload = () => {
    const textToDownload = selectedHistoryId 
      ? historyList.find(h => h.id === selectedHistoryId)?.resultMarkdown || result
      : result;

    if (!textToDownload) return;

    const element = document.createElement("a");
    const file = new Blob([textToDownload], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = `會議摘要與翻譯報告_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Display specific layout of the selected history item
  const handleSelectHistory = (id: string) => {
    const matched = historyList.find(h => h.id === id);
    if (matched) {
      setSelectedHistoryId(id);
      setResult(matched.resultMarkdown);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "sm": return "text-sm";
      case "lg": return "text-lg";
      case "xl": return "text-xl";
      default: return "text-base";
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans transition-all duration-300 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* 頂部導覽列 */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2.5 rounded-xl shadow-md shadow-indigo-100 cursor-pointer hover:rotate-3 transition-transform">
            <Sparkles className="h-5 w-5 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              會譯特助 AI Meeting Co-Pilot
            </h1>
            <p className="text-xs text-slate-400 font-mono tracking-widest hidden sm:block">
              INTELLIGENT MEETING TRANSLATION & SUMMARIZATION WORKSPACE
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-full border border-slate-200">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-mono text-slate-600">SERVER ACTIVE</span>
        </div>
      </header>

      {/* 主工作區配置：大螢幕雙欄, 小螢幕一欄 */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* 左側輸入與選項面板 (Columns: 5) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* 會議文本輸入卡片 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 bg-indigo-600 h-full" />
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">貼上會議紀錄與逐字稿</h2>
              </div>
              <button
                type="button"
                onClick={() => setTranscript("")}
                className="text-xs hover:text-rose-600 text-slate-400 flex items-center gap-1 transition-colors py-1 px-2.5 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100"
                title="清空輸入區"
                id="btn-clear-input"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>清空</span>
              </button>
            </div>

            {/* 試用範本快捷條 */}
            <div className="mb-4">
              <span className="text-xs text-slate-400 block mb-2 font-medium">✨ 點擊直接試用高品質範本：</span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_TEMPLATES.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => applyTemplate(sample.id)}
                    className="text-xs bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-600 py-1.5 px-3 rounded-lg border border-slate-200 hover:border-indigo-300 transition-all flex items-center space-x-1 cursor-pointer"
                    title={sample.description}
                    id={`btn-sample-${sample.id}`}
                  >
                    <span>{sample.icon}</span>
                    <span className="font-semibold">{sample.title.split(" ")[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <textarea
                value={transcript}
                onChange={(e) => {
                  setTranscript(e.target.value);
                  if (errorMessage) setErrorMessage("");
                }}
                placeholder="在此貼上會議逐字稿、錄音轉文字內容、非結構化的重要手記或者外文會議報告。支援超過一萬字，AI 會自動為您去蕪存菁轉化為繁體中文摘要..."
                className="w-full h-80 md:h-96 shrink-0 bg-slate-50 border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-150 rounded-xl p-4 text-sm text-slate-600 placeholder-slate-400 leading-relaxed font-mono resize-none focus:outline-none transition-all"
                id="textarea-meeting-text"
              />
              
              {/* 字數統計與邊欄裝飾 */}
              <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-white px-2.5 py-1 rounded-md border border-slate-250/75 text-[11px] text-slate-400 font-mono shadow-sm">
                <span>字數: {charCount.toLocaleString()}</span>
                <span className="text-slate-300">|</span>
                <span>單字: {wordCount.toLocaleString()}</span>
              </div>
            </div>

            {/* ERROR MESSAGE CARD */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start space-x-2"
                >
                  <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* AI 輸出規格設定選項 */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 bg-purple-600 h-full" />
            
            <div className="flex items-center space-x-2 mb-4">
              <Sliders className="h-4.5 w-4.5 text-purple-600" />
              <h2 className="text-sm font-bold text-slate-700">總結規格與風格設定</h2>
            </div>

            {/* 1. 輸出格式 */}
            <div className="space-y-2 mb-5">
              <label className="text-xs text-slate-400 font-medium flex justify-between">
                <span>📁 選擇彙整格式範本</span>
                <span className="text-indigo-600">繁體中文品質編譯</span>
              </label>
              
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: "action_items", title: "📋 行動核取清單", desc: "專案行動卡片、指派人與明確任務表格" },
                  { id: "detailed", title: "📝 詳細會議紀要", desc: "議題深度追蹤、發言人脈絡與全體決議" },
                  { id: "bullet", title: "🔢 一目了然條列", desc: "主旨大意與精煉五大核心結論彙一覽" },
                  { id: "digest", title: "💡 極簡短摘要", desc: "一句話總論、成果點評與未來戰略規劃" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id as SummaryFormat)}
                    className={`p-3 rounded-xl border text-left transition-all duration-250 relative overflow-hidden group cursor-pointer ${
                      format === item.id
                        ? "bg-indigo-50/60 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400"
                        : "bg-slate-50 border-slate-200 hover:border-slate-300 hover:bg-slate-100/50 text-slate-650"
                    }`}
                    id={`btn-format-${item.id}`}
                  >
                    {format === item.id && (
                      <div className="absolute -top-1 -right-1 bg-indigo-650 text-white p-0.5 rounded-bl-lg shadow-sm">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                    )}
                    <div className={`text-xs font-bold mb-1 ${format === item.id ? 'text-indigo-900' : 'text-slate-700'}`}>{item.title}</div>
                    <div className="text-[10px] text-slate-400 leading-relaxed line-clamp-2 group-hover:text-slate-505">
                      {item.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. 寫作口吻 */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-slate-400 font-medium block">👔 報告文字語意口吻</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "professional", label: "專業商務", style: "專業客觀經理人" },
                  { id: "casual", label: "輕鬆得體", style: "溫和有親和力" },
                  { id: "concise", label: "極簡俐落", style: "直指重點不客套" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTone(item.id as SummaryTone)}
                    className={`py-2 px-2.5 rounded-xl border text-center text-xs transition-all cursor-pointer ${
                      tone === item.id
                        ? "bg-purple-50/60 border-purple-400 text-purple-900 ring-1 ring-purple-400"
                        : "bg-slate-50 border-slate-200 text-slate-550 hover:text-slate-700 hover:bg-slate-100/50"
                    }`}
                    id={`btn-tone-${item.id}`}
                  >
                    <span className="block font-bold">{item.label}</span>
                    <span className="text-[9px] opacity-75">{item.style}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 翻譯目標語系 */}
            <div className="space-y-2 mb-4">
              <label className="text-xs text-slate-400 font-medium block">🌐 翻譯目標語系（選取第５點翻譯語言）</label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { id: "en", label: "英文", sub: "English" },
                  { id: "ja", label: "日文", sub: "日本語" },
                  { id: "ko", label: "韓文", sub: "한국어" },
                  { id: "zh-TW", label: "繁中", sub: "繁體中文" },
                  { id: "zh-CN", label: "簡中", sub: "简体中文" }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setLanguage(item.id as SummaryLanguage)}
                    className={`py-2 px-1 rounded-xl border text-center transition-all cursor-pointer ${
                      language === item.id
                        ? "bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400"
                        : "bg-slate-50 border-slate-200 text-slate-550 hover:text-slate-700 hover:bg-slate-100/50"
                    }`}
                    id={`btn-lang-${item.id}`}
                  >
                    <span className="block text-xs font-bold">{item.label}</span>
                    <span className="text-[9px] opacity-75 block">{item.sub}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 自訂指令 (Optional) */}
            <div className="space-y-2 mb-1">
              <label className="text-xs text-slate-400 font-medium flex justify-between items-center">
                <span>💭 額外自訂提示（選填，加強背景要求）</span>
                <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">DIRECTIVE</span>
              </label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="例如：『特別抓出行銷部的提案討論』、『同時生成一份簡短英文版本』"
                className="w-full py-2.5 px-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl text-xs text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                id="input-custom-prompt"
              />
            </div>

          </div>

          {/* 生成按鈕 (LARGE ACTIONS) */}
          <button
            type="button"
            disabled={isLoading || !transcript.trim()}
            onClick={handleGenerateSummary}
            className={`w-full py-4 px-6 rounded-xl font-bold text-base shadow-lg flex items-center justify-center space-x-3 transition-all relative overflow-hidden cursor-pointer ${
              isLoading || !transcript.trim()
                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-150 active:scale-98"
            }`}
            id="btn-generate-co-pilot"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin text-white" />
                <span className="tracking-wide text-white">AI 特助正在彙總並翻譯報告...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-indigo-200 animate-bounce" />
                <span className="tracking-wide text-white">生成總結與翻譯</span>
              </>
            )}
          </button>

          {/* 歷史紀錄面板 */}
          {historyList.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3 text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-500" />
                  最近歷史紀錄 ({historyList.length}/10)
                </span>
                <button
                  onClick={clearHistory}
                  className="text-slate-400 hover:text-slate-600 font-semibold transition-colors cursor-pointer"
                  id="btn-clear-history"
                >
                  清除所有
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {historyList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectHistory(item.id)}
                    className={`group w-full p-2.5 rounded-xl text-left text-xs border transition-all cursor-pointer flex justify-between items-center ${
                      selectedHistoryId === item.id
                        ? "bg-indigo-50 border-indigo-300 text-indigo-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate mr-2">
                      <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">{item.timestamp}</span>
                      <span className="truncate">{item.title}</span>
                    </div>
                    <button
                      onClick={(e) => deleteHistoryItem(item.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-md transition-all flex-shrink-0 cursor-pointer"
                      title="刪除"
                      id={`btn-del-history-${item.id}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>

        {/* 右側結果與報告展示面板 (Columns: 7) */}
        <section className="lg:col-span-7 lg:sticky lg:top-24 h-auto min-h-[40rem] flex flex-col">
          
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            
            {/* 結果欄精緻控制排版 */}
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <h2 className="text-sm font-bold text-slate-750">AI 生成會議報告書</h2>
                
                {selectedHistoryId && (
                  <span className="text-[10px] bg-indigo-50 text-indigo-650 px-2.5 py-0.5 rounded-full font-bold border border-indigo-150 animate-pulse">
                    歷史紀錄存檔
                  </span>
                )}
              </div>

              {/* 字級調整與一鍵複製 / 下載 */}
              <div className="flex items-center space-x-2.5">
                {/* 字級控制 */}
                <div className="flex items-center bg-white px-2 py-1 rounded-lg border border-slate-200 space-x-1.5" title="調整字體大小">
                  <FontIcon className="h-3 w-3 text-slate-400" />
                  <div className="flex gap-1 text-[10px] font-bold">
                    {(["sm", "base", "lg", "xl"] as const).map((sz) => (
                      <button
                        key={sz}
                        onClick={() => setFontSize(sz)}
                        className={`px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                          fontSize === sz 
                            ? "bg-indigo-600 text-white" 
                            : "text-slate-400 hover:bg-slate-50 hover:text-slate-700"
                        }`}
                        id={`btn-size-${sz}`}
                      >
                        {sz.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 複製按鈕 */}
                {(result || selectedHistoryId) && (
                  <>
                    <button
                      onClick={handleCopy}
                      className={`py-1.5 px-3 rounded-lg border text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer ${
                        copied
                          ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                          : "bg-white border-slate-200 hover:bg-slate-55 text-slate-750 hover:border-slate-350"
                      }`}
                      title="複製 Markdown 到剪貼簿"
                      id="btn-copy-markdown"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>已複製</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-400" />
                          <span>一鍵複製結果</span>
                        </>
                      )}
                    </button>

                    {/* 下載按鈕 */}
                    <button
                      onClick={handleDownload}
                      className="bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-750 py-1.5 px-3 rounded-lg text-xs font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer"
                      title="匯出下載 Markdown 檔案 (.md)"
                      id="btn-download-md"
                    >
                      <Download className="h-3.5 w-3.5 text-indigo-600" />
                      <span>匯出 (.md)</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 結果中央視圖：未生成、載入中、已渲染 */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 bg-slate-50/50 min-h-[30rem]">
              <AnimatePresence mode="wait">
                
                {/* 1. MOCK / EMPTY STATE */}
                {!isLoading && !result && (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6"
                  >
                    <div className="h-16 w-16 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-500 mb-5 relative shadow-inner">
                      <FileDown className="h-7 w-7 text-indigo-550 opacity-80" />
                      <div className="absolute -top-1 -right-1 bg-indigo-500 h-3 w-3 rounded-full animate-ping" />
                    </div>
                    <h3 className="text-slate-800 font-bold text-lg mb-1.5">等待生成會議總結報告</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto leading-relaxed mb-6">
                      請在左側填入「逐字稿」或「隨手筆記」，設定好格式與寫作口吻後，點擊按鈕，Co-Pilot 將為您提煉高品質報告。
                    </p>

                    {/* 特色亮點說明 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-lg text-left mt-2">
                      <div className="bg-white p-3.5 border border-slate-200/80 shadow-xs rounded-xl">
                        <div className="text-indigo-600 font-bold text-xs mb-1">🤖 智慧清理贅字</div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          自動過濾逐字稿大量口語廢話與贅字，流暢提煉。
                        </p>
                      </div>
                      <div className="bg-white p-3.5 border border-slate-200/80 shadow-xs rounded-xl">
                        <div className="text-purple-650 font-bold text-xs mb-1">🇹🇼 台灣繁體編譯</div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          對外文原始對話進行極流暢翻譯，落實台灣精準商務詞彙。
                        </p>
                      </div>
                      <div className="bg-white p-3.5 border border-slate-200/80 shadow-xs rounded-xl">
                        <div className="text-emerald-650 font-bold text-xs mb-1">📊 本地機密安全</div>
                        <p className="text-[11px] text-slate-500 leading-normal">
                          自動加入精美 Markdown 結論表格。支援匯出一鍵存擋。
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 2. LOADING STATE */}
                {isLoading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="relative mb-6">
                      {/* Outer spinning ring */}
                      <div className="h-16 w-16 rounded-full border-4 border-slate-100 border-t-indigo-600 border-r-indigo-400 animate-spin" />
                      {/* Static central logo */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-2.5 rounded-xl shadow-md border border-slate-100">
                        <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                      </div>
                    </div>

                    <h3 className="text-slate-800 font-bold text-lg mb-2">Meeting Co-Pilot 正在施展魔法...</h3>
                    
                    {/* Dynamic loading label steps */}
                    <div className="bg-slate-100 border border-slate-200 px-4 py-2.5 rounded-xl text-xs text-indigo-700 font-semibold inline-flex items-center space-x-2 shadow-inner">
                      <RefreshCw className="h-3.5 w-3.5 text-indigo-600 animate-spin" />
                      <span>{loadingMessages[loadingStep]}</span>
                    </div>

                    <p className="text-slate-400 text-xs max-w-xs mt-4 leading-relaxed">
                      AI 正在進行逐章贅詞分析、台灣商用語調常規化，大約需要 5-15 秒。
                    </p>
                  </motion.div>
                )}

                {/* 3. GENERATION RESULT RENDERED */}
                {!isLoading && result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100 }}
                    className="relative"
                  >
                    {/* White business document mockup style */}
                    <div className="bg-white text-slate-800 shadow-xl rounded-xl p-6 md:p-8 border border-slate-200 relative transition-all duration-200">
                      
                      {/* Fancy Document Watermark or Branding */}
                      <div className="flex justify-between items-center border-b border-indigo-100 pb-3.5 mb-6 text-xs text-slate-400 font-sans tracking-wide">
                        <div className="flex items-center space-x-1.5 font-bold">
                          <Check className="h-3.5 w-3.5 text-indigo-600" />
                          <span className="text-slate-700">會譯特助 完美報告書</span>
                        </div>
                        <span className="font-mono text-slate-400">{new Date().toLocaleDateString("zh-TW")} 發行</span>
                      </div>

                      {/* Render markdown with beautiful custom classes */}
                      <div className={`markdown-body ${getFontSizeClass()}`}>
                        <ReactMarkdown>{result}</ReactMarkdown>
                      </div>

                      {/* Footer reference note */}
                      <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>由 Gemini-3.5-flash 高效模型生成</span>
                        <span>繁體中文翻譯與技術詞彙整理完成</span>
                      </div>

                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>

        </section>

      </main>

      {/* 底部 Footer 標籤版 */}
      <footer className="bg-slate-50 text-slate-400 text-[11px] py-4 px-8 mt-12 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        <p>© 2026 會譯特助 AI Meeting Co-Pilot. 所有生成報告均保存在本地瀏覽器，確保商業機密安全。</p>
        <div className="flex items-center space-x-4">
          <span className="text-slate-350">|</span>
          <span className="font-mono uppercase text-[9px] text-slate-400">SYSTEM READY | TAIWAN TRADITIONAL CHINESE</span>
        </div>
      </footer>
    </div>
  );
}
