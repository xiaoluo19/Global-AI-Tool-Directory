import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputPath = resolve(root, "src/data/toolUpdates.ts");

const categories = [
  {
    category: "通用对话与写作",
    query: "latest AI assistant model writing tool launch ChatGPT Claude Gemini DeepSeek",
  },
  {
    category: "搜索研究与资料核实",
    query: "latest AI search research tool Perplexity Elicit NotebookLM product update",
  },
  {
    category: "视觉设计与图片生成",
    query: "latest AI image generator design tool GPT Image Midjourney Firefly Ideogram",
  },
  {
    category: "视频生成与剪辑",
    query: "latest AI video generator Seedance Kling Runway Sora Pika Veo update",
  },
  {
    category: "音频配音与音乐",
    query: "latest AI voice music generator ElevenLabs Suno Udio Mureka update",
  },
  {
    category: "PPT与办公效率",
    query: "latest AI presentation productivity Gamma WPS Notion Microsoft Copilot update",
  },
  {
    category: "编程开发与网站制作",
    query: "latest AI coding website builder Cursor Codex Claude Code Lovable v0 update",
  },
  {
    category: "自动化流程与Agent",
    query: "latest AI agent automation Dify Coze n8n Make Zapier Gumloop update",
  },
  {
    category: "新媒体运营",
    query: "latest AI social media marketing content tool Jasper Copy.ai Buffer AI update",
  },
  {
    category: "Skill网站推荐",
    query: "latest AI skills prompt library GPTs agents GitHub awesome AI tools marketplace",
  },
  {
    category: "AI写作与文案",
    query: "latest AI writing copywriting tool marketing content assistant",
  },
  {
    category: "AI图片处理",
    query: "latest AI image editing remove background upscale cleanup tool",
  },
  {
    category: "AI设计工具",
    query: "latest AI design tool poster social media image UI design",
  },
  {
    category: "AI办公表格",
    query: "latest AI spreadsheet data analysis table Excel tool",
  },
  {
    category: "AI思维导图",
    query: "latest AI mind map diagram document to mindmap tool",
  },
  {
    category: "AI会议纪要",
    query: "latest AI meeting notes transcription summary tool",
  },
  {
    category: "AI翻译润色",
    query: "latest AI translation proofreading grammar localization tool",
  },
  {
    category: "AI内容检测",
    query: "latest AI content detector plagiarism checker tool",
  },
  {
    category: "AI提示词与指令",
    query: "latest AI prompt library prompt marketplace prompt engineering tool",
  },
  {
    category: "AI模型训练与评测",
    query: "latest AI model evaluation leaderboard model hosting platform",
  },
  {
    category: "国产AI工具",
    query: "最新 国产 AI 工具 发布 即梦 可灵 豆包 DeepSeek Kimi 通义 千问",
  },
];

async function searchTavily(query) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
      include_raw_content: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.results ?? []).map((item) => ({
    title: item.title,
    url: item.url,
    source: hostname(item.url),
    summary: item.content,
    publishedAt: item.published_date,
  }));
}

async function searchSerpApi(query) {
  const apiKey = process.env.SERPAPI_API_KEY;
  if (!apiKey) return [];

  const url = new URL("https://serpapi.com/search.json");
  url.searchParams.set("engine", "google");
  url.searchParams.set("q", query);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("num", "5");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`SerpAPI search failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return (data.organic_results ?? []).map((item) => ({
    title: item.title,
    url: item.link,
    source: item.source || hostname(item.link),
    summary: item.snippet,
    publishedAt: item.date,
  }));
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "unknown source";
  }
}

function cleanText(value, fallback = "") {
  return String(value || fallback)
    .replace(/\s+/g, " ")
    .replace(/[<>`]/g, "")
    .trim();
}

function toTs(report) {
  return `export interface ToolUpdateItem {
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

export const toolUpdateReport: ToolUpdateReport = ${JSON.stringify(report, null, 2)};
`;
}

async function main() {
  const hasSearchProvider = Boolean(process.env.TAVILY_API_KEY || process.env.SERPAPI_API_KEY);

  if (!hasSearchProvider) {
    const existing = await readFile(outputPath, "utf8");
    const patched = existing.replace(
      /updateWindow: ".*?"/,
      'updateWindow: "未配置搜索 API Key，保留当前内置基线。配置 TAVILY_API_KEY 或 SERPAPI_API_KEY 后将每日自动更新"',
    );
    await writeFile(outputPath, patched);
    console.log("No search API key configured. Kept seeded update report.");
    return;
  }

  const highlights = [];
  const sources = new Set();

  for (const item of categories) {
    const results = process.env.TAVILY_API_KEY
      ? await searchTavily(item.query)
      : await searchSerpApi(item.query);

    for (const result of results.slice(0, 2)) {
      if (!result.title || !result.url) continue;
      highlights.push({
        title: cleanText(result.title).slice(0, 90),
        source: cleanText(result.source, hostname(result.url)).slice(0, 60),
        url: result.url,
        category: item.category,
        summary: cleanText(result.summary, "发现新的 AI 工具或产品动态，建议品牌部评估是否纳入导航。").slice(0, 180),
        publishedAt: result.publishedAt ? cleanText(result.publishedAt).slice(0, 40) : undefined,
      });
      sources.add(cleanText(result.source, hostname(result.url)).slice(0, 60));
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    status: "auto-generated",
    updateWindow: "每日自动搜索公开网页、产品动态和工具榜单后生成",
    sources: [...sources].slice(0, 20),
    highlights: highlights.slice(0, 24),
  };

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toTs(report));
  console.log(`Wrote ${report.highlights.length} AI tool update items.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
