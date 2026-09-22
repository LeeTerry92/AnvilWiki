# 单仓库多游戏站使用与部署

本文说明当前多站首期的实际用法。它与 [multi-site.md](multi-site.md) 不同：后者介绍如何用 `anvilwiki-ops` 运营多个独立仓库，本文介绍同一个仓库内通过 `SITE_ID` 构建多个游戏站。

## 目录约定

每个站点位于 `sites/<site-id>/`：

```text
sites/wardogs/
├── site.config.ts       # 品牌、域名、主题和项目页开关
├── navigation.ts        # 内容分类与导航
├── routing.ts           # locale 和路由配置
├── home.page.ts         # 首页区块、顺序和文案
├── home.override.astro  # 可选的首页特殊结构
├── locales/             # 站点 UI 文案
├── content/wiki/        # 独立 MDX 内容
├── assets/              # 文章封面等构建期资源
├── theme.css            # 本站品牌色、明暗主题与字体栈
└── public/              # 图标、manifest、hero 等静态资源
```

`src/` 是所有站点共享的核心框架。不要把某个游戏的品牌判断写进公共组件；普通差异放进配置和首页区块，只有首页结构确实特殊时才使用 `home.override.astro`。

## 本地命令

未设置 `SITE_ID` 时仍是原有单站兼容模式。设置后，配置、内容、locale、资源和 public 都切换到对应站点：

```bash
SITE_ID=wardogs SITE_URL=https://www.wardogs.top pnpm dev
SITE_ID=wardogs SITE_URL=https://www.wardogs.top pnpm typecheck
SITE_ID=wardogs SITE_URL=https://www.wardogs.top pnpm build
SITE_ID=wardogs pnpm new-post
SITE_ID=wardogs pnpm bulk-new-posts -- path/to/articles.csv
SITE_ID=wardogs pnpm sync-codes
SITE_ID=wardogs pnpm refresh-audit
SITE_ID=wardogs pnpm gen-covers
```

构建前 `prepare:site` 会把公共 `_headers`、本站 `theme.css` 与本站 `public/` 合并到 `.generated/<site-id>/public/`。验证文件、广告单元、图标和品牌图片不会从其他站点继承。公共布局和组件样式仍在 `src/styles/globals.css`；每站只在 `theme.css` 中维护品牌色和字体栈，独有组件的样式保留在组件内。

生成图标、默认分享图和文章封面时也要带上站点标识：

```bash
SITE_ID=wardogs pnpm gen-assets
SITE_ID=wardogs pnpm gen-covers
```

这两个命令从本站 `theme.css` 取品牌色。`gen-assets` 写入本站 `public/` 并按站点保存缓存；未设置 `SITE_ID` 时仍沿用旧单站目录和 `globals.css`。

当前 `SITE_ID` 只限制为小写字母、数字和连字符；不存在的站点会在准备阶段因缺少必要目录而失败。首期不提供站点脚手架，新增站点时以现有站点目录为模板并逐项替换。

## 首页区块与覆盖

`home.page.ts` 的 `sections` 决定区块内容和顺序，支持 `hero`、`quick-start`、`recent`、`explore`、`faq` 和 `cta`。普通站点使用：

```ts
export const homePages = {
  en: {
    mode: 'blocks',
    meta: { title: 'Example Wiki', description: 'Example description' },
    sections: [
      { type: 'hero', title: 'Example Wiki', description: 'Game guides' },
      { type: 'recent', title: 'Latest Guides', category: 'guides', limit: 6 },
    ],
  },
};
```

特殊首页把 `mode` 改为 `override`，然后在站点自己的 `home.override.astro` 中组合公共区块与站点专属结构。覆盖范围仅限首页，其他页面继续使用核心路由。

`site.config.ts` 的 `theme` 当前支持 `default` 与 `tactical`。`projectLanding` 控制是否包含 AnvilWiki 自身的 `/landing/**` 和 `/zh/landing/**` 营销页面；普通游戏站应设置为 `false`。

## WARDOGS 内容快照

`sites/wardogs/content/wiki/en/` 保存 29 篇公开页面的内容快照；`data/` 保存 33 条社区测试版武器记录及三张地图的 171 个历史地点，`public/media/` 保存对应的页面图片。本站文章使用 `articlePathMode: 'flat'`，因此详情页沿用 `/wardogs-weapons/` 等根路径，而 `/guides/`、`/maps/` 等分类索引仍可访问。

快照基于 2026-09-14 的公开来源，不等于当前游戏实测。武器价格、地图名称、更新状态与计划内容都应按页面标注的来源和版本阅读。刷新快照需要 Python 的 `requests` 与 `beautifulsoup4`，并显式执行 `python3 scripts/import-wardogs-content.py --refresh`；脚本只覆盖带导入标记的文章，刷新前应检查上游内容和本地人工修改。

## Cloudflare Pages 独立部署

同一个 Git 仓库连接两个 Cloudflare Pages 项目，每个项目使用独立环境变量和域名：

| Pages 项目 | 构建命令 | 环境变量 | 输出目录 |
|---|---|---|---|
| `wiki-anvil-quest` | `pnpm build` | `SITE_ID=anvil-quest`、`SITE_URL=https://anvil.wiki` | `dist` |
| `wiki-wardogs` | `pnpm build` | `SITE_ID=wardogs`、`SITE_URL=https://www.wardogs.top` | `dist` |

两个项目都使用 Node 22 和 pnpm 11。Cloudflare Pages 中分别绑定正式域名；预览部署也沿用各项目自己的 `SITE_ID`，因此不会互相覆盖构建产物或缓存。

仓库根存在 `wrangler.toml` 时，它可能覆盖 Dashboard 中的同名构建变量。多站平台部署推荐让每个 Pages 项目在 Dashboard 明确设置 `SITE_ID` 与 `SITE_URL`，并确认没有根配置把它们写死成单一站点；详细优先级见 [deployment.md](deployment.md)。

## 首期边界

- 只支持首页特殊覆盖，不支持任意路由覆盖。
- 首页区块依赖 TypeScript 类型检查，暂未加入 Zod 和数据源存在性门禁。
- CI 固定构建两个站点，暂未按变更范围选择站点。
- secrets、额外 SEO 门禁和移动端截图回归仍沿用各部署项目的现有流程，本轮不新增平台层实现。
