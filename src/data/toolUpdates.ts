export interface ToolUpdateItem {
  title: string;
  source: string;
  url: string;
  category: string;
  summary: string;
  publishedAt?: string;
}

export interface ToolUpdateReport {
  generatedAt: string;
  status: "manual-seed" | "auto-generated";
  updateWindow: string;
  sources: string[];
  highlights: ToolUpdateItem[];
}

export const toolUpdateReport: ToolUpdateReport = {
  generatedAt: "2026-06-28T00:00:00.000Z",
  status: "manual-seed",
  updateWindow: "未配置搜索 API Key，保留当前内置基线。配置 TAVILY_API_KEY 或 SERPAPI_API_KEY 后将每日自动更新",
  sources: [
    "OpenAI Blog",
    "Anthropic News",
    "Google AI Blog",
    "Runway Blog",
    "Kling AI",
    "ByteDance Seed",
    "Product Hunt",
    "GitHub Trending",
  ],
  highlights: [
    {
      title: "Seedance 2.0",
      source: "ByteDance Seed",
      url: "https://jimeng.jianying.com/ai-tool/home",
      category: "视频生成与剪辑",
      summary: "短视频生成和音视频同步方向重点关注，适合新媒体产品视频与主视觉镜头。",
    },
    {
      title: "GPT Image",
      source: "OpenAI / ChatGPT",
      url: "https://chatgpt.com/",
      category: "视觉设计与图片生成",
      summary: "适合参考图改造、封面主视觉、产品场景图和品牌创意图生成。",
    },
    {
      title: "可灵AI",
      source: "Kling AI",
      url: "https://klingai.kuaishou.com/",
      category: "视频生成与剪辑",
      summary: "继续作为长一点产品视频、多镜头叙事和图生视频的重要备选。",
    },
  ],
};
