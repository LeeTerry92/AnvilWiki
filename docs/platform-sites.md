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
├── wrangler.toml         # 本站构建期变量
└── public/              # 本站 logo、favicon、广告单元和其他静态资源
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

构建前 `prepare:site` 会把公共 `_headers`、本站 `theme.css` 与本站 `public/` 合并到 `.generated/<site-id>/public/`。页头和页脚的 logo 使用本站 `public/logo.svg`；favicon、PWA 图标、分享图和广告单元也只从本站 `public/` 读取。缺少必需图标，或启用了 `PUBLIC_ADSTERRA_SLOT_*` 却没有本站对应的 `public/ads/<name>.html`，构建会失败。根目录 `public/` 仅供未设置 `SITE_ID` 的旧单站模式使用，不会进入多站构建。公共布局和组件样式仍在 `src/styles/globals.css`；每站只在 `theme.css` 中维护品牌色和字体栈，独有组件的样式保留在组件内。

生成图标、默认分享图和文章封面时也要带上站点标识：

```bash
SITE_ID=wardogs pnpm gen-assets --icons-only
SITE_ID=wardogs pnpm gen-covers
```

这两个命令从本站 `theme.css` 取品牌色。`gen-assets --icons-only` 更新 logo、favicon、PWA 图标和 manifest 主题色，不覆盖本站的分享图；不带该参数时也生成默认分享图。`gen-assets` 写入本站 `public/` 并按站点保存缓存；未设置 `SITE_ID` 时仍沿用旧单站目录和 `globals.css`。广告单元文件只放在需要投放的站点 `public/ads/` 下；例如 WARDOGS 没有启用广告，就无需建立该目录。

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
| Anvil Quest 的 Pages 项目 | `pnpm build:site anvil-quest` | `sites/anvil-quest/wrangler.toml` | `dist` |
| WARDOGS 的 Pages 项目 | `pnpm build:site wardogs` | `sites/wardogs/wrangler.toml` | `dist` |

两个项目都使用 Node 22 和 pnpm 11。框架预设选 Astro，仓库根目录留空，输出目录填 `dist`，构建命令按上表分别填写。Cloudflare Pages 中分别绑定正式域名；预览部署沿用各项目自己的构建命令。

Pages Git 集成只自动读取仓库根的 `wrangler.toml`，不能靠放在 `sites/<id>/` 就让它按项目选择。多站仓库的根目录**没有** `wrangler.toml`，两个 Pages 项目在 Dashboard 分别设置构建命令和输出目录。`build:site` 读取指定站点文件的 `[vars]`，先清除继承的站点变量，并将 `.env.example` 中列出的可选变量置空，再启动原有构建；本地 `.env` 也不会补入另一站的变量。因此每站的域名、评论、广告和统计只在本目录维护。不要再用普通 `pnpm build` 作为这两个 Pages 项目的构建命令，也不要在 Dashboard 中配置同名站点变量。变更构建命令后重新部署，并检查构建日志出现 `[site] building wardogs for https://www.wardogs.top`。

从旧配置迁移时，先把两个 Pages 项目的构建命令改成上表，再推送删除根 `wrangler.toml` 的提交，避免某个项目仍按普通 `pnpm build` 构建。根配置的旧内容已迁至 Anvil Quest 的站点文件；`wrangler.template.toml` 仅供单站 fork 初始化，不会被 Pages 自动读取。

这两个子目录文件是**构建期变量清单**，不是 Pages Git 集成自动应用的 Wrangler 部署配置。新增 Pages Functions 绑定时，还需按 Cloudflare 的 Pages 配置规则单独处理部署流程；当前两站都是纯静态输出。

## 首期边界

- 只支持首页特殊覆盖，不支持任意路由覆盖。
- 首页区块依赖 TypeScript 类型检查，暂未加入 Zod 和数据源存在性门禁。
- CI 固定构建两个站点，暂未按变更范围选择站点。
- secrets、额外 SEO 门禁和移动端截图回归仍沿用各部署项目的现有流程，本轮不新增平台层实现。
