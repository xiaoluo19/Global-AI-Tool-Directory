import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  BookOpen,
  Bot,
  Boxes,
  Check,
  ChevronRight,
  Code2,
  Compass,
  ExternalLink,
  FileCheck2,
  Film,
  Filter,
  Gem,
  Globe2,
  Headphones,
  Languages,
  ListTree,
  Map,
  MessageSquare,
  Presentation,
  ScanSearch,
  Search,
  Sparkles,
  Star,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  brandWorkflows,
  categories,
  compareRows,
  scenarioGuides,
  tools,
  type Tool,
} from "./data/tools";
import { aiBotImportedTools } from "./data/aiBotImportedTools";
import { toolUpdateReport } from "./data/toolUpdates";

type PageKey = "dashboard" | "directory" | "scenarios" | "workflow" | "compare";

const pages: { key: PageKey; label: string }[] = [
  { key: "dashboard", label: "首页" },
  { key: "directory", label: "工具导航" },
  { key: "scenarios", label: "场景推荐" },
  { key: "workflow", label: "品牌部工作流" },
  { key: "compare", label: "工具对比" },
];

const categoryIcons: Record<string, typeof Bot> = {
  通用对话与写作: MessageSquare,
  搜索研究与资料核实: Search,
  视觉设计与图片生成: Gem,
  视频生成与剪辑: Film,
  音频配音与音乐: Headphones,
  PPT与办公效率: Presentation,
  编程开发与网站制作: Code2,
  自动化流程与Agent: Workflow,
  新媒体运营: BarChart3,
  Skill网站推荐: BookOpen,
  AI写作与文案: MessageSquare,
  AI图片处理: ScanSearch,
  AI设计工具: Gem,
  AI办公表格: BarChart3,
  AI思维导图: Map,
  AI会议纪要: FileCheck2,
  AI翻译润色: Languages,
  AI内容检测: FileCheck2,
  AI提示词与指令: ListTree,
  AI模型训练与评测: Boxes,
  国产AI工具: BadgeCheck,
  海外AI工具: Globe2,
};

const filterTags = ["免费", "国内可用", "新手友好", "品牌部常用"] as const;
const categoryShortcuts = [
  "通用对话与写作",
  "搜索研究与资料核实",
  "视觉设计与图片生成",
  "视频生成与剪辑",
  "音频配音与音乐",
  "PPT与办公效率",
  "编程开发与网站制作",
  "自动化流程与Agent",
  "新媒体运营",
  "Skill网站推荐",
  "AI写作与文案",
];

const DIRECTORY_RENDER_LIMIT = 144;
const allTools = mergeTools(tools, aiBotImportedTools);

function dashboardStats(toolList: Tool[]) {
  const scenes = new Set(toolList.flatMap((tool) => tool.scenarios));
  return [
    { label: "收录AI工具", value: `${toolList.length}+` },
    { label: "覆盖工作场景", value: `${Math.max(25, scenes.size)}+` },
    { label: "品牌部推荐流程", value: "5套" },
    { label: "新手友好工具", value: `${toolList.filter((tool) => tool.difficulty === "新手友好").length}+` },
  ];
}

function mergeTools(primary: Tool[], imported: Tool[]) {
  const seen = new Set(primary.map((tool) => tool.name.toLowerCase()));
  return [
    ...primary,
    ...imported.filter((tool) => {
      const key = tool.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }),
  ];
}

function App() {
  const [activePage, setActivePage] = useState<PageKey>("dashboard");
  const [globalQuery, setGlobalQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部工具");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const pageRef = useRef<HTMLElement | null>(null);

  useAnimeAmbientMotion();

  const featuredTools = useMemo(
    () =>
      ["ChatGPT", "Kimi", "豆包", "即梦AI", "GPT Image", "Seedance 2.0", "可灵AI", "Perplexity", "Cursor", "Gamma"]
        .map((name) => tools.find((tool) => tool.name === name))
        .filter((tool): tool is Tool => Boolean(tool)),
    [],
  );

  const filteredTools = useMemo(() => {
    return allTools.filter((tool) => {
      const haystack = [
        tool.name,
        tool.description,
        tool.category,
        ...tool.scenarios,
        ...tool.tags,
        ...tool.department,
      ]
        .join(" ")
        .toLowerCase();
      const queryMatch = haystack.includes(globalQuery.trim().toLowerCase());
      const categoryMatch =
        selectedCategory === "全部工具" ||
        tool.category === selectedCategory ||
        tool.tags.includes(selectedCategory);
      const filtersMatch = activeFilters.every((filter) => {
        if (filter === "免费") return tool.pricing === "免费" || tool.pricing === "部分免费";
        if (filter === "国内可用") return tool.access === "国内可用";
        if (filter === "新手友好") return tool.difficulty === "新手友好";
        if (filter === "品牌部常用") return tool.tags.includes("品牌部常用");
        return true;
      });
      return queryMatch && categoryMatch && filtersMatch;
    });
  }, [activeFilters, globalQuery, selectedCategory]);

  function toggleFilter(filter: string) {
    setActiveFilters((current) =>
      current.includes(filter) ? current.filter((item) => item !== filter) : [...current, filter],
    );
  }

  function jumpToDirectory(category?: string) {
    if (category) {
      setSelectedCategory(category);
    }
    setActivePage("directory");
  }

  const renderPage = () => {
    if (activePage === "dashboard") {
      return (
        <Dashboard
          onOpenDirectory={jumpToDirectory}
          onNavigate={setActivePage}
          featuredTools={featuredTools}
          stats={dashboardStats(allTools)}
        />
      );
    }
    if (activePage === "directory") {
      return (
        <Directory
          query={globalQuery}
          onQueryChange={setGlobalQuery}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          activeFilters={activeFilters}
          onToggleFilter={toggleFilter}
          filteredTools={filteredTools}
          allTools={allTools}
        />
      );
    }
    if (activePage === "scenarios") return <ScenarioGuide />;
    if (activePage === "workflow") return <BrandWorkflow />;
    return <ToolCompare />;
  };

  useEffect(() => {
    const root = pageRef.current;
    if (!root) return;
    let cancelled = false;
    let timeline: { pause: () => void } | undefined;

    import("animejs").then(({ createTimeline, stagger }) => {
      if (cancelled) return;
      const nextTimeline = createTimeline({
        defaults: {
          ease: "outCubic",
          duration: 420,
        },
      });
      timeline = nextTimeline;

      nextTimeline
        .add(root.querySelectorAll("[data-animate='page-title']"), {
          opacity: [0, 1],
          y: [8, 0],
          filter: ["blur(4px)", "blur(0px)"],
        })
        .add(
          root.querySelectorAll("[data-animate='card']"),
          {
            opacity: [0, 1],
            y: [8, 0],
            delay: stagger(12, { start: 30 }),
          },
          "-=300",
        );
    });

    return () => {
      cancelled = true;
      timeline?.pause();
    };
  }, [activePage]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-houde-radial text-slate-100">
      <AnimatedBackground />
      <Header activePage={activePage} onNavigate={setActivePage} />
      <section ref={pageRef} className="relative mx-auto max-w-[1800px] px-7 pb-8 pt-5">
        {renderPage()}
      </section>
    </main>
  );
}

function useAnimeAmbientMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let cancelled = false;
    const animations: { pause: () => void }[] = [];

    const start = () => {
      import("animejs").then(({ animate, stagger }) => {
        if (cancelled) return;
        const dots = document.querySelectorAll(".neural-dot");
        animations.push(
          animate(dots, {
            translateX: () => `${Math.random() * 46 - 23}px`,
            translateY: () => `${Math.random() * 46 - 23}px`,
            scale: () => [0.7, 1.35],
            opacity: () => [0.22, 0.78],
            duration: () => 3600 + Math.random() * 2400,
            delay: stagger(180),
            alternate: true,
            loop: true,
            ease: "inOutSine",
          }),
          animate(".scan-beam", {
            translateX: ["-10vw", "125vw"],
            opacity: [0, 0.72, 0],
            duration: 6800,
            loop: true,
            ease: "inOutQuad",
          }),
          animate(".ai-logo", {
            boxShadow: [
              "0 0 20px rgba(167,139,250,0.18)",
              "0 0 34px rgba(217,70,239,0.36)",
              "0 0 20px rgba(167,139,250,0.18)",
            ],
            duration: 3200,
            loop: true,
            ease: "inOutSine",
          }),
        );
      });
    };

    const timer = window.setTimeout(start, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      animations.forEach((animation) => animation.pause());
    };
  }, []);
}

function Header({ activePage, onNavigate }: { activePage: PageKey; onNavigate: (page: PageKey) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-violet-200/[0.06] bg-[#05030a]/72 backdrop-blur-2xl">
      <div className="mx-auto flex h-[62px] max-w-[1800px] items-center gap-8 px-7">
        <button onClick={() => onNavigate("dashboard")} className="flex items-center gap-3">
          <AiLogo />
          <span className="text-xl font-semibold tracking-wide text-white">厚德AI工具导航站</span>
        </button>

        <nav className="flex h-full flex-1 items-center justify-center gap-8">
          {pages.map((page) => (
            <button
              key={page.key}
              onClick={() => onNavigate(page.key)}
              className={`relative h-full px-2 text-sm font-medium transition ${
                activePage === page.key ? "text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              {page.label}
              {activePage === page.key && (
                <span className="absolute bottom-0 left-1/2 h-[3px] w-11 -translate-x-1/2 rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-400 shadow-[0_0_18px_rgba(167,139,250,0.55)]" />
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}

function AiLogo() {
  return (
    <div className="ai-logo relative grid size-10 place-items-center rounded-[8px] border border-violet-300/35 bg-violet-400/10 shadow-[0_0_30px_rgba(167,139,250,0.22)]">
      <div className="absolute inset-1 rounded-[7px] bg-[conic-gradient(from_180deg,rgba(217,70,239,0.0),rgba(217,70,239,0.38),rgba(99,102,241,0.52),rgba(217,70,239,0.0))] opacity-80" />
      <svg viewBox="0 0 48 48" className="relative size-7 text-violet-100" aria-hidden="true">
        <path
          d="M24 5 38.5 13.5V30.5L24 39 9.5 30.5V13.5L24 5Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinejoin="round"
          opacity="0.92"
        />
        <path
          d="M24 13.5V24M15 18.5 24 24 33 18.5M15 29.5 24 24 33 29.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.78"
        />
        <circle cx="24" cy="24" r="3.5" fill="currentColor" />
        <circle cx="15" cy="18.5" r="2.4" fill="currentColor" />
        <circle cx="33" cy="18.5" r="2.4" fill="currentColor" />
        <circle cx="15" cy="29.5" r="2.4" fill="currentColor" />
        <circle cx="33" cy="29.5" r="2.4" fill="currentColor" />
      </svg>
    </div>
  );
}

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(167,139,250,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(217,70,239,0.026)_1px,transparent_1px)] bg-[size:76px_76px]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(124,58,237,0.30),transparent_20%),radial-gradient(circle_at_78%_5%,rgba(217,70,239,0.20),transparent_26%),radial-gradient(circle_at_70%_82%,rgba(99,102,241,0.18),transparent_30%)]" />
      <div className="neural-field absolute inset-0 opacity-70">
        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={index}
            className="neural-dot absolute size-1 rounded-full bg-violet-100 shadow-[0_0_20px_rgba(167,139,250,0.95)]"
            style={{
              left: `${8 + ((index * 13) % 84)}%`,
              top: `${10 + ((index * 19) % 78)}%`,
            }}
          />
        ))}
      </div>
      <div className="scan-beam absolute left-[-20%] top-[12%] h-[32rem] w-[18rem] rotate-12 bg-gradient-to-r from-transparent via-fuchsia-300/10 to-transparent blur-xl" />
      <div className="absolute left-[-14%] top-[8%] h-[46rem] w-[46rem] rounded-full border border-violet-300/10 bg-violet-500/5 blur-[1px] animate-orbit-slow" />
      <div className="absolute right-[-12%] top-[14%] h-[34rem] w-[34rem] rounded-full border border-fuchsia-300/10 bg-fuchsia-500/5 animate-orbit-reverse" />
      <div className="absolute inset-x-[-10%] top-[18%] h-px rotate-[-8deg] bg-gradient-to-r from-transparent via-violet-300/30 to-transparent animate-energy-sweep" />
      <div className="absolute inset-x-[-10%] top-[54%] h-px rotate-[7deg] bg-gradient-to-r from-transparent via-fuchsia-300/20 to-transparent animate-energy-sweep-delayed" />
      <div className="absolute left-[18%] top-[20%] size-1.5 rounded-full bg-violet-200/70 shadow-[0_0_18px_rgba(167,139,250,0.9)] animate-float-node" />
      <div className="absolute left-[62%] top-[30%] size-1 rounded-full bg-fuchsia-200/70 shadow-[0_0_18px_rgba(217,70,239,0.9)] animate-float-node-delayed" />
      <div className="absolute left-[84%] top-[70%] size-1.5 rounded-full bg-indigo-200/70 shadow-[0_0_18px_rgba(99,102,241,0.9)] animate-float-node" />
    </div>
  );
}

function Dashboard({
  onOpenDirectory,
  onNavigate,
  featuredTools,
  stats,
}: {
  onOpenDirectory: (category?: string) => void;
  onNavigate: (page: PageKey) => void;
  featuredTools: Tool[];
  stats: ReturnType<typeof dashboardStats>;
}) {
  return (
    <div className="space-y-4">
      <section data-animate="card" className="motion-card relative overflow-hidden rounded-[8px] border border-violet-300/15 bg-[#090513]/76 p-7 shadow-card">
        <HeroVisual />
        <div className="relative grid grid-cols-[1fr_580px] gap-8">
          <div className="min-h-[172px] pt-3">
            <h1 data-animate="page-title" className="hero-title max-w-3xl text-[40px] font-semibold leading-tight text-white">
              <span className="block">
                <AnimatedHeadline text="按工作场景，快速找到合适的" />
              </span>
              <span className="mt-1 block text-[52px] leading-none">
                <AnimatedHeadline text="AI 工具" accent />
              </span>
            </h1>
            <p className="mt-4 text-base text-slate-300">面向公司各部门的 AI 工具分类导航与效率入口</p>
            <div className="mt-8 flex items-center gap-3">
              <button
                onClick={() => onOpenDirectory()}
                className="inline-flex h-12 items-center gap-2 rounded-[8px] bg-gradient-to-r from-fuchsia-500 to-violet-400 px-7 text-sm font-semibold text-white shadow-[0_0_28px_rgba(167,139,250,0.28)] transition hover:brightness-110"
              >
                进入工具导航 <Compass className="size-4" />
              </button>
              <button
                onClick={() => onNavigate("scenarios")}
                className="inline-flex h-12 items-center gap-2 rounded-[8px] border border-violet-300/35 bg-violet-400/10 px-6 text-sm font-semibold text-violet-200 transition hover:bg-violet-400/18"
              >
                查看真实场景流程 <Sparkles className="size-4" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {stats.map((stat, index) => (
              <StatCard key={stat.label} index={index} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      </section>

      <section data-animate="card" className="motion-card rounded-[8px] border border-violet-200/10 bg-[#090513]/82 p-3 shadow-card backdrop-blur-xl">
        <div className="grid grid-cols-10 gap-2">
          {categoryShortcuts.map((category) => {
            const Icon = categoryIcons[category] ?? Bot;
            return (
              <button
                key={category}
                onClick={() => onOpenDirectory(category)}
                className="group flex h-[70px] flex-col items-center justify-center gap-2 rounded-[8px] border border-transparent text-xs font-medium text-slate-300 transition hover:border-violet-300/40 hover:bg-violet-400/[0.08] hover:text-white"
              >
                <Icon className="size-5 text-houde-cyan group-hover:text-houde-green" />
                <span className="w-full truncate px-1 text-center">{shortCategoryName(category)}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-[1fr_560px] gap-4">
        <div className="space-y-4">
          <AutoUpdatePanel />
          <Panel
            title="精选工具"
            subtitle="高频入口"
            action="查看全部工具"
            onAction={() => onOpenDirectory()}
          >
            <div className="grid grid-cols-5 gap-3">
              {featuredTools.map((tool) => (
                <MiniToolCard key={tool.name} tool={tool} />
              ))}
            </div>
          </Panel>

          <Panel title="工具对比" subtitle="精选场景对比预览" action="查看完整对比" onAction={() => onNavigate("compare")}>
            <div className="overflow-hidden rounded-[8px] border border-white/8">
              <table className="w-full border-collapse text-left text-sm">
                <tbody>
                  {compareRows.slice(0, 5).map((row) => (
                    <tr key={row.scene} className="border-b border-white/7 bg-white/[0.025] last:border-b-0">
                      <td className="w-36 px-4 py-2.5 text-slate-300">{row.scene}</td>
                      <td className="w-44 px-4 py-2.5 font-medium text-white">{row.primary}</td>
                      <td className="px-4 py-2.5 text-slate-500">{row.reason}</td>
                      <td className="px-4 py-2.5 text-slate-400">{row.alternatives.slice(0, 3).join("、")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <div className="space-y-4">
          <Panel title="场景推荐" subtitle="按任务一键套流程" action="查看更多" onAction={() => onNavigate("scenarios")}>
            <div className="space-y-3">
              {scenarioGuides.slice(0, 3).map((scenario, index) => (
                <ScenarioStrip key={scenario.title} scenario={scenario} index={index} />
              ))}
            </div>
          </Panel>

          <Panel title="品牌部工作流" subtitle="沉淀最佳实践" action="查看更多" onAction={() => onNavigate("workflow")}>
            <div className="grid grid-cols-3 gap-3">
              {brandWorkflows.slice(0, 3).map((workflow, index) => (
                <WorkflowPreview key={workflow.title} workflow={workflow} index={index} />
              ))}
            </div>
          </Panel>

          <section className="relative overflow-hidden rounded-[8px] border border-violet-300/20 bg-[#090513]/82 p-5 shadow-card">
            <div className="relative z-10">
              <h3 className="text-lg font-semibold text-white">
                找不到合适的 <span className="text-violet-200">工具?</span>
              </h3>
              <p className="mt-2 text-sm text-slate-400">告诉我们你的需求，获取个性化推荐</p>
              <button
                onClick={() => onOpenDirectory()}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-[8px] bg-gradient-to-r from-fuchsia-500 to-violet-400 px-8 text-sm font-semibold text-white"
              >
                智能推荐工具 <ArrowRight className="size-4" />
              </button>
            </div>
            <div className="absolute bottom-[-58px] right-[-30px] size-44 rounded-[8px] border border-violet-300/30 bg-violet-500/10 shadow-[0_0_70px_rgba(167,139,250,0.24)] rotate-45" />
          </section>
        </div>
      </div>
    </div>
  );
}

function Directory({
  query,
  onQueryChange,
  selectedCategory,
  onCategoryChange,
  activeFilters,
  onToggleFilter,
  filteredTools,
  allTools,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  selectedCategory: string;
  onCategoryChange: (value: string) => void;
  activeFilters: string[];
  onToggleFilter: (value: string) => void;
  filteredTools: Tool[];
  allTools: Tool[];
}) {
  const visibleTools = filteredTools.slice(0, DIRECTORY_RENDER_LIMIT);
  const hiddenCount = Math.max(0, filteredTools.length - visibleTools.length);

  return (
    <div className="space-y-4">
      <PageTitle title="工具导航" subtitle="按分类、关键词和标签快速定位可用工具。" />
      <div data-animate="card">
        <AutoUpdatePanel compact />
      </div>
      <div className="grid grid-cols-[250px_1fr] gap-4">
        <aside data-animate="card" className="sticky top-[82px] flex h-[calc(100vh-104px)] flex-col overflow-hidden rounded-[8px] border border-violet-200/10 bg-[#090513]/86 p-4 shadow-card backdrop-blur-xl">
          <div className="mb-4 flex shrink-0 items-center gap-2 text-sm font-medium text-white">
            <Filter className="size-4 text-houde-cyan" />
            分类筛选
          </div>
          <div className="category-scroll min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {["全部工具", ...categories].map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`flex h-10 w-full items-center justify-between rounded-[8px] px-3 text-left text-sm transition ${
                  selectedCategory === category
                    ? "bg-houde-cyan/15 text-white ring-1 ring-houde-cyan/35"
                    : "text-slate-400 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="truncate">{category}</span>
                <span className="text-xs text-slate-500">
                  {category === "全部工具"
                    ? allTools.length
                    : allTools.filter((tool) => tool.category === category || tool.tags.includes(category)).length}
                </span>
              </button>
            ))}
          </div>
        </aside>

        <section className="min-w-0 space-y-4">
          <div data-animate="card" className="motion-card rounded-[8px] border border-violet-200/10 bg-[#090513]/86 p-4 shadow-card backdrop-blur-xl">
            <SearchBox value={query} onChange={onQueryChange} compact />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {filterTags.map((filter) => {
                const active = activeFilters.includes(filter);
                return (
                  <button
                    key={filter}
                    onClick={() => onToggleFilter(filter)}
                    className={`inline-flex h-9 items-center gap-2 rounded-[8px] px-3 text-sm transition ${
                      active
                        ? "bg-houde-green/18 text-houde-green ring-1 ring-houde-green/35"
                        : "bg-white/[0.05] text-slate-300 hover:bg-violet-300/[0.09]"
                    }`}
                  >
                    {active && <Check className="size-4" />}
                    {filter}
                  </button>
                );
              })}
              <span className="ml-auto text-sm text-slate-400">匹配 {filteredTools.length} 个工具</span>
            </div>
          </div>

          <LatestCategoryUpdates selectedCategory={selectedCategory} />

          <div className="grid grid-cols-4 gap-3">
            {visibleTools.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
          {hiddenCount > 0 && (
            <div className="rounded-[8px] border border-violet-200/10 bg-[#090513]/70 p-5 text-center text-sm text-slate-400">
              已先展示前 {DIRECTORY_RENDER_LIMIT} 个结果，继续使用搜索、分类或标签缩小范围，可查看更多精准工具。
            </div>
          )}
          {filteredTools.length === 0 && (
            <div className="rounded-[8px] border border-violet-200/10 bg-[#090513]/70 p-10 text-center text-slate-400">
              没有找到匹配工具，试试减少筛选条件或更换关键词。
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function LatestCategoryUpdates({ selectedCategory }: { selectedCategory: string }) {
  const items =
    selectedCategory === "全部工具"
      ? toolUpdateReport.highlights
      : toolUpdateReport.highlights.filter((item) => item.category === selectedCategory);

  if (items.length === 0) {
    return null;
  }

  return (
    <section className="rounded-[8px] border border-violet-300/15 bg-[#090513]/86 p-4 shadow-card backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-violet-200" />
          <h3 className="text-sm font-semibold text-white">
            {selectedCategory === "全部工具" ? "全站最新 AI 工具动态" : `${selectedCategory} 最新动态`}
          </h3>
        </div>
        <span className="text-xs text-slate-500">{toolUpdateReport.updateWindow}</span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {items.slice(0, 3).map((item) => (
          <a
            key={`${item.category}-${item.title}`}
            href={item.url}
            target="_blank"
            rel="noreferrer"
            data-animate="card"
            className="motion-card rounded-[8px] border border-white/10 bg-white/[0.045] p-3 transition hover:border-violet-300/35 hover:bg-violet-400/[0.08]"
          >
            <p className="truncate text-sm font-semibold text-white">{item.title}</p>
            <p className="mt-1 text-xs text-violet-200">{item.source}</p>
            <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">{item.summary}</p>
          </a>
        ))}
      </div>
    </section>
  );
}

function AutoUpdatePanel({ compact = false }: { compact?: boolean }) {
  const generatedDate = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(toolUpdateReport.generatedAt));

  return (
    <section className={`rounded-[8px] border border-violet-300/15 bg-[#090513]/86 shadow-card backdrop-blur-xl ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-violet-200" />
            <h2 className="text-base font-semibold text-white">每日自动更新</h2>
            <span className="rounded-[6px] bg-violet-400/12 px-2 py-1 text-xs text-violet-200">
              {toolUpdateReport.status === "auto-generated" ? "自动生成" : "待部署自动任务"}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            每天定时搜索 AI 工具官网、产品发布、榜单和开发者动态，生成分类更新情报；网站仍保持纯静态部署。
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-xs text-slate-500">最近更新</p>
          <p className="mt-1 text-sm font-medium text-violet-100">{generatedDate}</p>
        </div>
      </div>
      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          {toolUpdateReport.highlights.slice(0, 3).map((item) => (
            <a
              key={item.title}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              data-animate="card"
              className="motion-card rounded-[8px] border border-white/10 bg-white/[0.045] p-3 transition hover:border-violet-300/35 hover:bg-violet-400/[0.08]"
            >
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-1 text-xs text-violet-200">{item.category}</p>
              <p className="mt-2 line-clamp-3 text-xs leading-5 text-slate-400">{item.summary}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

function ScenarioGuide() {
  return (
    <div className="space-y-4">
      <PageTitle title="场景推荐" subtitle="从“我要完成什么任务”出发，直接套用工具组合。" />
      <div className="grid grid-cols-3 gap-4">
        {scenarioGuides.map((scenario, index) => (
          <section
            key={scenario.title}
            data-animate="card"
            className="motion-card rounded-[8px] border border-violet-200/10 bg-[#090513]/86 p-5 shadow-card backdrop-blur-xl transition hover:border-violet-300/40"
          >
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-[8px] bg-gradient-to-br from-houde-green/80 to-houde-blue/80 text-sm font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{scenario.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">{scenario.summary}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {scenario.steps.map((step, stepIndex) => (
                <div key={`${scenario.title}-${step.tool}`} className="flex gap-3">
                  <div className="flex w-6 flex-col items-center">
                    <div className="grid size-6 place-items-center rounded-full border border-houde-cyan/40 text-xs text-houde-cyan">
                      {stepIndex + 1}
                    </div>
                    {stepIndex < scenario.steps.length - 1 && <div className="h-full w-px bg-white/10" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium text-white">{step.tool}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{step.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function BrandWorkflow() {
  return (
    <div className="space-y-4">
      <PageTitle title="品牌部工作流" subtitle="5 套可复制的品牌部 AI 生产流程，强调输入、工具和产出。" />
      <div className="space-y-4">
        {brandWorkflows.map((workflow) => (
          <section key={workflow.title} data-animate="card" className="motion-card rounded-[8px] border border-violet-200/10 bg-[#090513]/86 p-6 shadow-card backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-semibold text-white">{workflow.title}</h3>
                <p className="mt-2 text-sm text-slate-400">{workflow.description}</p>
              </div>
              <div className="rounded-[8px] border border-houde-green/25 bg-houde-green/10 px-3 py-2 text-sm text-houde-green">
                {workflow.steps.length} 步闭环
              </div>
            </div>
            <div className="workflow-step-grid relative grid grid-cols-5 gap-5">
              {workflow.steps.slice(0, -1).map((step, index) => (
                <div
                  key={`${step.name}-connector`}
                  className="workflow-connector pointer-events-none absolute top-[52px] z-20 grid size-7 -translate-x-1/2 place-items-center rounded-full border border-violet-200/25 bg-[#160d2a]/95 text-violet-100 shadow-[0_0_18px_rgba(167,139,250,0.28)] backdrop-blur"
                  style={{ left: `${((index + 1) / workflow.steps.length) * 100}%` }}
                >
                  <ChevronRight className="size-4" />
                </div>
              ))}
              {workflow.steps.map((step, index) => (
                <div key={step.name} data-animate="card" className="motion-card rounded-[8px] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-houde-cyan">Step {index + 1}</p>
                  <h4 className="mt-3 text-sm font-semibold text-white">{step.name}</h4>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {step.tools.map((tool) => (
                      <span key={tool} className="rounded-[6px] bg-houde-blue/15 px-2 py-1 text-xs text-houde-cyan">
                        {tool}
                      </span>
                    ))}
                  </div>
                  <p className="mt-4 text-xs leading-5 text-slate-400">产出物：{step.output}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ToolCompare() {
  return (
    <div className="space-y-4">
      <PageTitle title="工具对比" subtitle="不同工作场景下的首选工具和备选工具。" />
      <section data-animate="card" className="motion-card overflow-hidden rounded-[8px] border border-violet-200/10 bg-[#090513]/86 shadow-card backdrop-blur-xl">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.04] text-sm text-slate-300">
              <th className="px-5 py-4 font-medium">场景</th>
              <th className="px-5 py-4 font-medium">首选工具</th>
              <th className="px-5 py-4 font-medium">备选工具</th>
              <th className="px-5 py-4 font-medium">推荐理由</th>
            </tr>
          </thead>
          <tbody>
            {compareRows.map((row) => (
              <tr key={row.scene} data-animate="card" className="border-b border-white/7 transition hover:bg-violet-400/[0.06]">
                <td className="px-5 py-4 text-sm font-medium text-white">{row.scene}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-2 rounded-[8px] bg-houde-green/15 px-3 py-1.5 text-sm font-medium text-houde-green">
                    <Star className="size-4 fill-current" />
                    {row.primary}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {row.alternatives.map((item) => (
                      <span key={item} className="rounded-[8px] bg-white/[0.06] px-3 py-1.5 text-sm text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm leading-6 text-slate-400">{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  compact = false,
}: {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <label
      className={`group flex items-center gap-3 rounded-[8px] border border-houde-cyan/35 bg-slate-950/62 px-4 shadow-[0_0_26px_rgba(34,211,238,0.14)] backdrop-blur-xl transition focus-within:border-houde-cyan/80 ${
        compact ? "h-12" : "h-[48px]"
      }`}
    >
      <Search className="size-5 text-houde-cyan" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="搜索工具、场景或关键词，例如：写文案、做海报、生成视频、查资料、写代码"
        className="h-full min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
      />
      {!compact && (
        <span className="inline-flex h-9 items-center rounded-[8px] bg-gradient-to-r from-houde-green to-houde-cyan px-5 text-sm font-semibold text-slate-950">
          搜索
        </span>
      )}
    </label>
  );
}

function StatCard({ label, value, index }: { label: string; value: string; index: number }) {
  const icons = [Boxes, Globe2, Workflow, BadgeCheck];
  const Icon = icons[index] ?? Boxes;
  const numberRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    const element = numberRef.current;
    if (!element) return;
    const target = Number(value.match(/\d+/)?.[0] ?? 0);
    const suffix = value.replace(String(target), "");
    const state = { value: 0 };
    let cancelled = false;
    let animation: { pause: () => void } | undefined;

    import("animejs").then(({ animate }) => {
      if (cancelled) return;
      animation = animate(state, {
        value: target,
        duration: 980,
        delay: index * 90,
        ease: "outExpo",
        onUpdate: () => {
          element.textContent = `${Math.round(state.value)}${suffix}`;
        },
      });
    });

    return () => {
      cancelled = true;
      animation?.pause();
    };
  }, [index, value]);

  return (
    <div data-animate="card" className="motion-card min-h-[140px] rounded-[8px] border border-white/10 bg-white/[0.045] p-5 shadow-card backdrop-blur-xl">
      <div className="grid size-9 place-items-center rounded-[8px] bg-houde-cyan/12 text-houde-cyan">
        <Icon className="size-5" />
      </div>
      <p ref={numberRef} className="stat-number mt-5 text-[32px] font-semibold leading-none text-white">{value}</p>
      <p className="mt-3 text-sm text-slate-300">{label}</p>
      <p className="mt-2 text-xs text-houde-green">{index === 0 ? "持续更新中" : index === 1 ? "全场景覆盖" : index === 2 ? "沉淀最佳实践" : "快速上手"}</p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  action?: string;
  onAction?: () => void;
  children: ReactNode;
}) {
  return (
    <section data-animate="card" className="motion-card rounded-[8px] border border-violet-200/10 bg-[#090513]/86 p-5 shadow-card backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          <span className="text-xs text-slate-500">{subtitle}</span>
        </div>
        {action && (
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1 text-xs font-medium text-houde-cyan transition hover:text-houde-green"
          >
            {action} <ChevronRight className="size-4" />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function MiniToolCard({ tool }: { tool: Tool }) {
  return (
    <article data-animate="card" className="motion-card group min-h-[126px] rounded-[8px] border border-white/10 bg-white/[0.055] p-3 transition hover:border-houde-cyan/50 hover:bg-houde-cyan/[0.08]">
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-[8px] bg-gradient-to-br from-houde-cyan/25 to-houde-blue/25 text-sm font-bold text-white ring-1 ring-white/10">
          {tool.name.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">{tool.name}</h3>
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{tool.description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {[tool.difficulty, tool.access, tool.pricing].slice(0, 3).map((tag) => (
          <span key={tag} className="rounded-[6px] bg-houde-cyan/10 px-2 py-1 text-[11px] text-houde-cyan">
            {tag}
          </span>
        ))}
      </div>
      <a
        href={tool.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex h-8 items-center gap-2 rounded-[8px] bg-houde-cyan/12 px-3 text-xs font-semibold text-houde-cyan transition hover:bg-houde-cyan/20"
      >
        进入工具 <ArrowRight className="size-3.5" />
      </a>
    </article>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article data-animate="card" className="motion-card group flex min-h-[248px] flex-col rounded-[8px] border border-white/10 bg-white/[0.045] p-4 shadow-card transition hover:border-houde-cyan/45 hover:bg-houde-cyan/[0.08]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-white">{tool.name}</h3>
          <p className="mt-1 text-xs text-houde-cyan">{tool.category}</p>
        </div>
        <div className="flex items-center gap-1 rounded-[8px] bg-houde-green/12 px-2 py-1 text-xs font-medium text-houde-green">
          <Star className="size-3 fill-current" />
          {tool.recommendation}
        </div>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{tool.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {tool.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="rounded-[6px] bg-slate-900/80 px-2 py-1 text-xs text-slate-300 ring-1 ring-white/8">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-auto space-y-3 pt-5">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <InfoPill label={tool.pricing} />
          <InfoPill label={tool.access} />
          <InfoPill label={tool.difficulty} />
          <InfoPill label={tool.department[0]} />
        </div>
        <a
          href={tool.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-houde-green via-houde-cyan to-houde-blue text-sm font-semibold text-slate-950 transition hover:brightness-110"
        >
          进入工具 <ExternalLink className="size-4" />
        </a>
      </div>
    </article>
  );
}

function ScenarioStrip({ scenario, index }: { scenario: (typeof scenarioGuides)[number]; index: number }) {
  const accents = ["from-houde-green/45", "from-houde-cyan/35", "from-violet-500/35"];
  return (
    <article data-animate="card" className="motion-card grid grid-cols-[120px_1fr] overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.045] transition hover:border-houde-cyan/40">
      <div className={`relative bg-gradient-to-br ${accents[index]} to-transparent p-4`}>
        <Sparkles className="size-9 text-white" />
      </div>
      <div className="min-w-0 p-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">{scenario.title}</h3>
          <p className="truncate text-xs text-slate-500">{scenario.summary}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 overflow-hidden">
          {scenario.steps.slice(0, 4).map((step, stepIndex) => (
            <div key={step.tool} className="flex min-w-0 items-center gap-2">
              <span className="rounded-[6px] bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-slate-200">{step.tool}</span>
              {stepIndex < Math.min(3, scenario.steps.length - 1) && <ArrowRight className="size-3.5 shrink-0 text-houde-cyan" />}
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function WorkflowPreview({ workflow, index }: { workflow: (typeof brandWorkflows)[number]; index: number }) {
  const icons = [MessageSquare, Film, Globe2];
  const Icon = icons[index] ?? Workflow;
  return (
    <article data-animate="card" className="motion-card rounded-[8px] border border-white/10 bg-white/[0.045] p-4">
      <Icon className="size-7 text-houde-cyan" />
      <h3 className="mt-4 min-h-[40px] text-sm font-semibold leading-5 text-white">{workflow.title}</h3>
      <div className="mt-3 space-y-1.5">
        {workflow.steps.slice(0, 4).map((step, stepIndex) => (
          <p key={step.name} className="truncate text-xs text-slate-400">
            <span className="mr-2 text-houde-cyan">{stepIndex + 1}</span>
            {step.name}
          </p>
        ))}
      </div>
    </article>
  );
}

function InfoPill({ label }: { label: string }) {
  return <span className="truncate rounded-[6px] bg-white/[0.05] px-2 py-1.5 text-center text-slate-400">{label}</span>;
}

function PageTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section data-animate="page-title" className="rounded-[8px] border border-violet-200/10 bg-[#090513]/86 p-5 shadow-card backdrop-blur-xl">
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-houde-cyan">Houde AI Workbench</p>
      <h1 className="text-3xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
    </section>
  );
}

function AnimatedHeadline({ text, accent = false }: { text: string; accent?: boolean }) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const chars = ref.current?.querySelectorAll(".headline-char");
    if (!chars?.length) return;
    let cancelled = false;
    let animation: { pause: () => void } | undefined;

    import("animejs").then(({ animate, stagger }) => {
      if (cancelled) return;
      animation = animate(chars, {
        opacity: [0, 1],
        y: [24, 0],
        rotateX: [42, 0],
        filter: ["blur(8px)", "blur(0px)"],
        duration: 760,
        delay: stagger(22, { start: accent ? 260 : 90 }),
        ease: "outExpo",
      });
    });

    return () => {
      cancelled = true;
      animation?.pause();
    };
  }, [accent, text]);

  return (
    <span ref={ref} className="inline align-baseline">
      {Array.from(text).map((char, index) => (
        <span
          key={`${char}-${index}`}
          className={`headline-char inline-block whitespace-pre ${accent ? "hero-accent-char" : ""}`}
        >
          {char}
        </span>
      ))}
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-28 bottom-[-132px] size-[390px] rounded-full border border-violet-300/20 shadow-[0_0_90px_rgba(167,139,250,0.32),inset_0_0_70px_rgba(99,102,241,0.18)] animate-orbit-slow" />
      <div className="absolute -left-12 bottom-[-52px] size-[230px] rounded-full border-2 border-fuchsia-300/45 shadow-[0_0_80px_rgba(217,70,239,0.36)] animate-orbit-reverse" />
      <div className="absolute left-[7%] top-[34%] size-3 rounded-full bg-violet-100 shadow-[0_0_28px_rgba(167,139,250,1)] animate-float-node" />
      <div className="absolute bottom-0 left-0 h-px w-[62%] bg-gradient-to-r from-transparent via-violet-300/70 to-transparent animate-energy-sweep" />
      <div className="absolute bottom-0 left-0 h-40 w-[62%] bg-[radial-gradient(ellipse_at_bottom,rgba(124,58,237,0.25),transparent_62%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(160deg,transparent_0%,rgba(167,139,250,0.16)_44%,transparent_45%),linear-gradient(20deg,transparent_0%,rgba(217,70,239,0.12)_46%,transparent_47%)] animate-grid-drift" />
    </div>
  );
}

function shortCategoryName(category: string) {
  return category
    .replace("通用对话与写作", "通用对话与写作")
    .replace("搜索研究与资料核实", "搜索研究")
    .replace("视觉设计与图片生成", "视觉设计")
    .replace("视频生成与剪辑", "视频生成")
    .replace("音频配音与音乐", "音频配音")
    .replace("PPT与办公效率", "PPT办公")
    .replace("编程开发与网站制作", "代码开发")
    .replace("自动化流程与Agent", "自动化流程")
    .replace("新媒体运营", "新媒体运营")
    .replace("Skill网站推荐", "Skill网站")
    .replace("AI写作与文案", "AI写作")
    .replace("AI图片处理", "图片处理")
    .replace("AI设计工具", "设计工具")
    .replace("AI办公表格", "办公表格")
    .replace("AI思维导图", "思维导图")
    .replace("AI会议纪要", "会议纪要")
    .replace("AI翻译润色", "翻译润色")
    .replace("AI内容检测", "内容检测")
    .replace("AI提示词与指令", "提示词")
    .replace("AI模型训练与评测", "模型评测");
}

export default App;
