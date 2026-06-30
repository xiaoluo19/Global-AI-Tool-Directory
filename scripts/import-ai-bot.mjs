import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = process.argv[2] || "/tmp/ai-bot.html";
const outputPath = resolve(root, "src/data/aiBotImportedTools.ts");
const sourceUrl = "https://ai-bot.cn/";
const trackingParams = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "utm_type",
  "utm_page",
  "utm_plan",
  "utm_unit",
  "utm_keyword",
  "utm_account",
  "utm",
  "cgv",
  "ref",
  "referrer_s",
  "referrer",
  "refc",
  "from",
  "_f",
  "fr",
  "source",
  "bsource",
  "channel",
  "channelid",
  "channelCode",
  "utm_channel",
  "ad_channel",
  "hmmd",
  "track",
  "track_id",
  "keyfrom",
  "regFrom",
  "share_token",
  "pic",
  "invite",
  "inviteCode",
  "invite_code",
  "invite_ref",
  "invitationCode",
  "inviteSource",
  "sharerUserId",
  "_channel_track_key",
]);

const canonicalUrlByName = new Map(
  Object.entries({
    "ChatGPT": "https://chatgpt.com/",
    "Claude": "https://claude.ai/",
    "Gemini": "https://gemini.google.com/",
    "Grok": "https://grok.com/",
    "DeepSeek": "https://chat.deepseek.com/",
    "DeepSeek深度求索": "https://chat.deepseek.com/",
    "豆包": "https://www.doubao.com/",
    "Kimi智能助手": "https://www.kimi.com/",
    "Kimi PPT助手": "https://www.kimi.com/",
    "千问": "https://chat.qwen.ai/",
    "Qwen Chat": "https://chat.qwen.ai/",
    "通义千问": "https://tongyi.aliyun.com/",
    "文心一言": "https://yiyan.baidu.com/",
    "智谱清言": "https://chatglm.cn/",
    "讯飞星火": "https://xinghuo.xfyun.cn/",
    "腾讯元宝": "https://yuanbao.tencent.com/",
    "秘塔AI搜索": "https://metaso.cn/",
    "Perplexity": "https://www.perplexity.ai/",
    "NotebookLM": "https://notebooklm.google.com/",
    "Midjourney": "https://www.midjourney.com/",
    "Stable Diffusion": "https://stability.ai/",
    "Civitai": "https://civitai.com/",
    "即梦": "https://jimeng.jianying.com/",
    "即梦AI": "https://jimeng.jianying.com/",
    "绘蛙": "https://www.ihuiwa.com/",
    "绘蛙AI": "https://www.ihuiwa.com/",
    "绘蛙AI视频": "https://www.ihuiwa.com/",
    "LiblibAI": "https://www.liblib.art/",
    "LiblibAI·哩布哩布AI": "https://www.liblib.art/",
    "通义万相": "https://tongyi.aliyun.com/wanxiang/",
    "通义万相AI视频": "https://tongyi.aliyun.com/wanxiang/",
    "可灵AI": "https://klingai.kuaishou.com/",
    "Seedance": "https://jimeng.jianying.com/",
    "Higgsfield": "https://higgsfield.ai/",
    "Vidu": "https://www.vidu.cn/",
    "Runway": "https://runwayml.com/",
    "Pika": "https://pika.art/",
    "Sora": "https://sora.com/",
    "Gamma": "https://gamma.app/",
    "Canva": "https://www.canva.com/",
    "魔力工作室": "https://www.canva.cn/magic/",
    "美图设计室": "https://www.designkit.com/",
    "Figma AI": "https://www.figma.com/ai/",
    "Pixso AI": "https://pixso.cn/",
    "Suno": "https://suno.com/",
    "ElevenLabs": "https://elevenlabs.io/",
    "Mureka": "https://www.mureka.ai/",
    "讯飞听见": "https://www.iflyrec.com/",
    "Cursor": "https://www.cursor.com/",
    "Codex": "https://chatgpt.com/codex",
    "Claude Code": "https://www.anthropic.com/claude-code",
    "GitHub Copilot": "https://github.com/features/copilot",
    "Bolt.new": "https://bolt.new/",
    "Lovable": "https://lovable.dev/",
    "Replit Agent": "https://replit.com/ai",
    "Windsurf": "https://windsurf.com/",
    "Dify": "https://dify.ai/",
    "扣子": "https://www.coze.cn/",
    "Coze": "https://www.coze.cn/",
    "FastGPT": "https://fastgpt.cn/",
    "Flowith": "https://flowith.io/",
    "n8n": "https://n8n.io/",
    "OpenRouter": "https://openrouter.ai/",
    "Google AI Studio": "https://aistudio.google.com/",
    "Hugging Face": "https://huggingface.co/",
    "魔搭社区": "https://www.modelscope.cn/",
    "Ollama": "https://ollama.com/",
    "SkillHub": "https://skillhub.cn/",
    "GitHub": "https://github.com/",
    "GitHub Skills": "https://skills.github.com/",
    "YouMind": "https://youmind.com/",
    "OpenAI Academy": "https://academy.openai.com/",
    "DeepLearning.AI": "https://www.deeplearning.ai/",
    "Coursera": "https://www.coursera.org/",
    "Kaggle": "https://www.kaggle.com/",
    "提示工程指南": "https://www.promptingguide.ai/zh",
    "PromptHero": "https://prompthero.com/",
    "PromptBase": "https://promptbase.com/",
    "Awesome ChatGPT Prompts": "https://prompts.chat/",
    "微信公众平台": "https://mp.weixin.qq.com/",
    "小红书创作服务平台": "https://creator.xiaohongshu.com/",
    "知乎": "https://www.zhihu.com/creator",
    "新榜": "https://www.newrank.cn/",
    "LibTV": "https://liblib.art/",
    "咔片PPT": "https://www.cappt.cc/",
    "WorkBuddy": "https://www.codebuddy.cn/",
    "CodeBuddy IDE": "https://www.codebuddy.ai/",
    "讯飞星辰MaaS": "https://xingchen.xfyun.cn/",
  }),
);

const categoryMap = [
  [/写作|文案|论文|小说|公文/, "AI写作与文案"],
  [/图像|图片|插画|绘画|背景|抹除|放大|修复|商品图|3D/, "视觉设计与图片生成"],
  [/视频|数字人|剪辑/, "视频生成与剪辑"],
  [/幻灯片|演示|PPT/, "PPT与办公效率"],
  [/表格|数据/, "AI办公表格"],
  [/思维导图/, "AI思维导图"],
  [/会议|转录|纪要/, "AI会议纪要"],
  [/文档|效率|办公|招聘|法律/, "PPT与办公效率"],
  [/翻译|语言/, "AI翻译润色"],
  [/聊天|对话/, "通用对话与写作"],
  [/智能体|Agent|插件|Skills/, "自动化流程与Agent"],
  [/编程|代码/, "编程开发与网站制作"],
  [/设计/, "AI设计工具"],
  [/音频|音乐|配音|语音/, "音频配音与音乐"],
  [/搜索/, "搜索研究与资料核实"],
  [/学习|教程|课程/, "Skill网站推荐"],
  [/模型|训练|框架|开发平台/, "AI模型训练与评测"],
  [/内容检测|AIGC|降AI/, "AI内容检测"],
  [/提示|指令|Prompt/, "AI提示词与指令"],
];

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function stripTags(value = "") {
  return decodeHtml(value.replace(/<[^>]+>/g, " "));
}

function normalizeCategory(sourceCategory) {
  const clean = stripTags(sourceCategory);
  const match = categoryMap.find(([pattern]) => pattern.test(clean));
  return match ? match[1] : "海外AI工具";
}

function normalizeUrl(url) {
  const clean = decodeHtml(url);
  if (!clean) return "https://ai-bot.cn/";
  if (clean.startsWith("http")) return clean;
  if (clean.startsWith("//")) return `https:${clean}`;
  if (clean.startsWith("/")) return `https://ai-bot.cn${clean}`;
  return clean;
}

function stripTrackingParams(url) {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (trackingParams.has(key) || key.startsWith("utm_")) {
        parsed.searchParams.delete(key);
      }
    }
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url;
  }
}

function isReferralUrl(url) {
  try {
    const parsed = new URL(url);
    const referralHosts = ["cgref.cn", "paluai.com", "cgaff.link", "fas.st", "try.elevenlabs.io"];
    if (referralHosts.some((host) => parsed.hostname.endsWith(host))) return true;
    if (/\/invite(?:\/|$)|\/register|\/signup|invitation/i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

function canonicalizeUrl(name, dataUrl, pageUrl) {
  const canonical = canonicalUrlByName.get(name);
  if (canonical) return canonical;

  const external = [dataUrl, pageUrl]
    .map(normalizeUrl)
    .filter((url) => url && !url.includes("ai-bot.cn/sites/") && !isReferralUrl(url));
  const selected = external[0] || normalizeUrl(dataUrl || pageUrl);
  if (isReferralUrl(selected) && pageUrl) return stripTrackingParams(pageUrl);
  return stripTrackingParams(selected);
}

function difficultyFromDescription(description) {
  if (/开发|模型|API|训练|框架|代码|编程/.test(description)) return "专业";
  if (/平台|工作流|数据|自动化|Agent|智能体/.test(description)) return "中等";
  return "新手友好";
}

function pricingFromDescription(description) {
  if (/免费/.test(description)) return "免费";
  if (/付费|会员|商业/.test(description)) return "付费";
  return "部分免费";
}

function departmentForCategory(category) {
  if (category.includes("编程") || category.includes("模型")) return ["研发部", "信息部", "品牌部"];
  if (category.includes("会议") || category.includes("办公") || category.includes("表格")) return ["品牌部", "行政部", "运营部"];
  if (category.includes("视频") || category.includes("图") || category.includes("设计")) return ["品牌部", "设计部", "新媒体"];
  return ["品牌部", "市场部", "运营部"];
}

function tagsForCategory(category, sourceCategory) {
  const tags = ["来自AI工具集", category];
  const cleanSource = stripTags(sourceCategory);
  if (cleanSource && cleanSource !== category) tags.push(cleanSource);
  if (/国产|中文|国内|通义|百度|讯飞|腾讯|阿里|字节|快手|美图|稿定|墨刀|网易|B站/.test(cleanSource)) {
    tags.push("国产AI工具");
  }
  return [...new Set(tags)].slice(0, 5);
}

function toTs(items) {
  return `import type { Tool } from "./tools";

// Auto-imported from public category/tool cards on ai-bot.cn.
// Only factual metadata is kept: tool name, category, URL, and rewritten generic descriptions.
export const aiBotImportedTools: Tool[] = ${JSON.stringify(items, null, 2)};
`;
}

async function loadHtml() {
  if (process.argv[2]) return readFile(sourcePath, "utf8");
  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "user-agent": "Houde-AI-Directory-Importer/1.0",
      },
    });
    if (response.ok) return response.text();
  } catch {
    // Fall back to a previously downloaded local copy.
  }
  return readFile(sourcePath, "utf8");
}

const html = await loadHtml();
const chunks = html.split(/<h4 class="text-gray text-lg[^>]*>/g).slice(1);
const imported = [];
const seen = new Set();

for (const chunk of chunks) {
  const categoryHtml = chunk.split("</h4>")[0] || "";
  const sourceCategory = stripTags(categoryHtml).replace(/^.*?term-\d+\s*/i, "").trim();
  const sectionBody = chunk.split(/<h4 class="text-gray text-lg[^>]*>/)[0] || chunk;
  const category = normalizeCategory(sourceCategory);
  const cardRegex = /<a href="([^"]+)"[^>]*data-url="([^"]*)"[^>]*class="card no-c[^"]*"[^>]*title="([^"]*)"[\s\S]*?<strong>([\s\S]*?)<\/strong>[\s\S]*?<p class="overflowClip_1 m-0 text-muted text-xs">([\s\S]*?)<\/p>/g;

  for (const match of sectionBody.matchAll(cardRegex)) {
    const pageUrl = normalizeUrl(match[1]);
    const dataUrl = normalizeUrl(match[2]);
    const title = stripTags(match[4]);
    const sourceDescription = stripTags(match[5] || match[3]);
    if (!title || title.length > 60) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    imported.push({
      name: title,
      description: `${title}：${sourceDescription || "AI 工具资源入口，适合按场景评估后使用。"}`,
      category,
      scenarios: [sourceCategory || category, "发现新工具", "工具评估"],
      tags: tagsForCategory(category, sourceCategory),
      url: canonicalizeUrl(title, dataUrl, pageUrl),
      pricing: pricingFromDescription(sourceDescription),
      access: /ai-bot\.cn|github|google|openai|anthropic|midjourney|huggingface|replicate|runway|suno|udio/i.test(dataUrl)
        ? "可能需要科学上网"
        : "国内可用",
      difficulty: difficultyFromDescription(sourceDescription),
      recommendation: 3,
      department: departmentForCategory(category),
    });
  }
}

await writeFile(outputPath, toTs(imported));
console.log(`Imported ${imported.length} tools from ${sourcePath}`);
