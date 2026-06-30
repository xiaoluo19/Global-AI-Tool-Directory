# 厚德AI工具导航站

PC 端静态 AI 工具导航网站，面向公司 AI 使用比赛展示和品牌部日常工作入口。项目使用 React + Vite + TypeScript + Tailwind CSS，不包含后端接口，不调用任何 AI API。

## 功能

- 首页 Dashboard：数据卡片、分类入口、推荐工具、每日自动更新摘要。
- 工具导航：左侧分类筛选、顶部搜索、免费/国内可用/新手友好/品牌部常用标签筛选。
- Skill 网站推荐：收录 GitHub、提示词库、GPT/Agent 商店、AI 技能学习站等资源入口。
- 参考 AI 导航站常见结构扩展：AI 写作、图片处理、设计、办公表格、思维导图、会议纪要、翻译润色、内容检测、提示词与模型评测等分类。
- 场景推荐：按任务输出工具组合与执行流程。
- 品牌部工作流：5 套品牌部 AI 工作流横向流程图。
- 工具对比：不同场景的首选工具与备选工具表格。
- 工具数据集中维护在 `src/data/tools.ts`。
- 每日更新摘要集中维护在 `src/data/toolUpdates.ts`。

## 每日自动更新

网站运行时仍是纯静态页面，不在浏览器里爬网，也不需要后端服务。自动更新通过 GitHub Actions 定时完成：

1. 每天 01:00 UTC 触发 `.github/workflows/daily-ai-tools.yml`。
2. 执行 `pnpm update:ai-tools`。
3. 脚本搜索公开网页、产品动态和 AI 工具榜单，生成 `src/data/toolUpdates.ts`。
4. 自动提交更新数据并重新部署 GitHub Pages。

要启用真实全网搜索，需要在 GitHub 仓库 Settings -> Secrets and variables -> Actions 中配置至少一个密钥：

- `TAVILY_API_KEY`
- `SERPAPI_API_KEY`

如果未配置搜索密钥，脚本会保留当前内置基线数据，构建不会失败。

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 手动生成每日更新

```bash
pnpm update:ai-tools
```

构建产物输出到 `dist/`。

## Render 部署

仓库已提供 `render.yaml`，推荐在 Render 中用 Blueprint 或重新连接仓库，让 Render 自动读取配置：

- Build Command：`pnpm install --frozen-lockfile && pnpm build`
- Publish Directory / Static Publish Path：`dist`
- Rewrite：`/* -> /index.html`

如果 Render 控制台里手动创建 Static Site，请务必确认发布目录是 `dist`，不要留空，也不要填项目根目录。否则虽然日志显示 build 成功，访问根域名仍会出现 `Not Found`。

## GitHub Pages 部署

项目已在 `vite.config.ts` 中设置 `base: "./"`，适合部署到 GitHub Pages 的项目页面。

1. 推送代码到 GitHub 仓库。
2. 在仓库 Settings -> Pages 中选择 GitHub Actions 或 `gh-pages` 分支部署。
3. 如果使用 Actions，可添加如下流程：

```yaml
name: Deploy static site

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    permissions:
      pages: write
      id-token: write
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```
