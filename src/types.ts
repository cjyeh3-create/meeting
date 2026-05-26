export interface SampleTemplate {
  id: string;
  title: string;
  icon: string;
  badge: string;
  description: string;
  content: string;
  defaultFormat: "bullet" | "detailed" | "action_items" | "digest";
  defaultTone: "professional" | "casual" | "concise";
}

export interface SummaryHistory {
  id: string;
  title: string;
  timestamp: string;
  originalTextLength: number;
  format: "bullet" | "detailed" | "action_items" | "digest";
  tone: "professional" | "casual" | "concise";
  language?: SummaryLanguage;
  resultMarkdown: string;
  provider?: "gemini" | "nvidia";
}

export type SummaryFormat = "bullet" | "detailed" | "action_items" | "digest";
export type SummaryTone = "professional" | "casual" | "concise";
export type SummaryLanguage = "en" | "ja" | "ko" | "zh-TW" | "zh-CN";

