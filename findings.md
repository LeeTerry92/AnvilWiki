# 多站点平台实施发现

## 本轮实施范围
- 用户确认采用渐进式单 Astro app 方案。
- 首期省略完整 SITE_ID 白名单、secrets 治理、区块 Zod/数据源门禁和新增 SEO/链接/移动端专项检查。
- 仍需完成两个站点、独立配置/内容/资源、首页区块、两主题、首页覆盖与独立 Pages 构建。

## 已知基线
- 当前仓库是单包 Astro 7 应用；内容、配置、public、SEO 扫描和脚本均按单站路径组织。
- 至少 32 个文件直接带单站路径或单一产物假设，其中 scripts 23 个。
- 用户已有 `.github/FUNDING.yml` 删除和未跟踪 `docs/game-wiki-platform-architecture.md`，不得覆盖。

## 待核验
- i18n UI JSON 的静态导入方式和首页文案依赖。
- MDX 图片相对路径、public 资产体积及站点迁移方式。
- 哪些脚本必须在首期跟随 active site，哪些属于旧 fork 初始化兼容面。

## 阶段 1 发现
- `src/i18n/ui.ts` 静态导入 `~/locales/en.json` 与 `ja.json`，首页文案、导航、列表页元数据和通用 UI 混在同一 JSON；首期可通过 `@site/locales/*` 别名保持现有 API，不需要改 50+ 消费者。
- 当前两个 locale 均是 en/ja，首批两个站点可以保持相同 locale 集，避免本轮引入任意 locale 动态模块加载。
- MDX 图片路径使用 `../../../../assets/...`；若站点保持 `content/wiki/<locale>/<category>` 与 `assets/` 同级结构，迁移到 `sites/<id>` 后相对路径无需改动。
- `src/assets` 约 1.3MB、`public` 约 1.1MB、内容约 112KB，复制/物化成本可控；但源码应以站点目录为单一来源，生成目录只用于 public 合并。
- `public` 同时包含通用 headers、模板 landing 素材、站点图标/hero/manifest 和广告单元；首期采用“根 public 作为共享基底，站点 public 同路径覆盖”的规则。
- 新站点构建必须优先参数化 `astro.config.ts`、`content.config.ts`、site/navigation/i18n facade、首页与 build/postbuild；旧 apply-template、template-audit 和初始化 workflow 暂留兼容路径，不作为多站创建入口。
- 现有首页模块可直接复用为区块：`QuickStart`、`ExploreModules`、`FaqSection`，Hero、Recent/Trending、Closing CTA 需从 `HomePage.astro` 抽出。
- `home-ui.test.ts` 强绑定“HomePage 直接读取 en.json home namespace”；改为站点 `home.page.ts` 后需要用新的注册表/配置契约测试替换该部分，FAQ 的 locale JSON 契约可保留。
- `check-config.ts` 与 `check-i18n.ts` 是现有门禁且硬编码单站路径。虽然不新增新门禁，多站构建命令仍需让它们读取 active site，否则第二站 CI 无法复用现有八道门禁。
- 推荐兼容策略：未设置 `SITE_ID` 时维持当前模板/`apply-template` 行为；设置 `SITE_ID` 时通过 Astro/Vite 精确别名和 SiteContext 切换站点模块。这样多站构建可用，同时不在首期重写约千行的旧换皮 CLI。

## 阶段 2 发现
- SiteContext 使用 `SITE_ID` 决定站点根、content、assets、locales 与 public overlay；未设置时 content/public 仍走 legacy 路径。
- 平台构建前只共享根 `public/_headers`，再将站点 public 复制到 `.generated/<site>/public`；验证文件、广告单元和品牌素材不跨站继承，Astro `publicDir` 指向物化目录。
- `anvil-quest` 已复制 12 个内容/目录占位文件与 16 个站点资产文件；MDX 的相对图片路径保持有效。
- `wardogs` 使用独立站点配置、导航、routing、locales、manifest 和两篇最小内容；其首页将用 override 模式验证特殊首页路径。
- `perl` 批量替换 wardogs locale 品牌词时系统 `C.UTF-8` locale 不可用而回退到 `C`，命令成功；后续 JSON 解析会验证文件未损坏。

## 阶段 3 发现
- 六类首页区块已形成统一 `HomeBlock` 判别联合和注册表；未引入 Zod，错误类型主要由 TypeScript 与组件内部 type 收窄处理。
- `anvil-quest` 使用普通区块渲染；`wardogs` 使用首页 override，并复用 Hero/Recent/QuickStart/CTA 公共区块，中间插入站点专属战术条。
- legacy、anvil-quest、wardogs 三种 `astro check` 均为 0 error/0 warning。
- 两站完整 build 成功：anvil-quest 174 页，wardogs 135 页；wardogs 的 Wiki 内容路由仅来自自己的 2 篇文章，默认语言缺失翻译仍按现有规则生成 ja fallback。
- 根 public 不能作为平台共享基底，否则会把 Anvil 的 Google 验证和广告单元带入 wardogs；已收口为只共享 `_headers`，站点 public 自带其余资源。
- 现有作者工具中，首期门禁所需的 check-config/check-content/check-i18n 必须读取 active site；new-post/bulk/sync/gen-covers/refresh 也应在文档宣称支持站点参数前完成同一改造。
- 根测试清单由 AGENTS 一致性测试钉死；本轮复用 `home-ui.test.ts` 而不新增套件，因此仍保持 21 suites/318 tests。
- 站点 locale JSON 移到 `sites/<id>/locales` 后 `$schema` 相对路径需从 `../../docs` 改为 `../../../docs`。
- wardogs 初次复制的 hero.svg 内含 Anvil Quest 文本，不能作为独立站点资产；需替换站点 OG/hero 资源，并重新 prepare 证明 Google 验证文件未进入 wardogs 物化目录。

## 阶段 4 收口发现
- 当前两站内容与配置隔离已生效，但 `src/pages/landing*` 和 `src/pages/zh/landing*` 仍会被 Astro 文件路由无条件纳入平台构建；仅隐藏导航不足以满足站点产物隔离。
- 路由隔离应由站点级开关控制，并在 Astro 路由解析阶段移除项目营销页，避免构建后删除产物或临时改动源码目录。
- 平台 public 共享面已收窄为根 `_headers`；重新执行 prepare 后可以直接从 `.generated/wardogs/public` 验证所有权文件、广告和微信资源未泄漏。
- 架构文档把项目落地页视为 AnvilWiki 自身能力而非游戏站内容；平台站不应携带 `/landing/**` 与 `/zh/landing/**`。站点配置需要一个仅控制该层路由的开关，legacy 模式继续保持现状。
- 首期明确不做任意页面覆盖和选择性 CI，因此 CI 只需以固定双站矩阵证明同一核心可分别 typecheck/build；不扩展到按 diff 计算站点集合。
- Wardogs public 重新物化后仅包含 `_headers` 与其自有 manifest、图标、hero；Google 验证文件、广告单元、微信二维码和 Anvil showcase 素材均未再出现。
- Wardogs 的 1200x630 WebP 已从专属 SVG 重新生成并目检，品牌文本、战术绿色主题和尺寸均正确，不再含 Anvil Quest 占位内容。
- Astro 的 `pages` Map 过滤在真实静态构建中生效：Wardogs 构建日志移除 17 个项目 landing 入口，最终仅生成 38 页；`dist` 中不存在 `/landing`、`/zh/landing`、相关 sitemap/llms 链接或页头入口。
- Wardogs 最终产物未出现 Anvil 的 Google 验证文件、广告单元或微信二维码；内容详情只有 `supply-codes` 和 `first-deployment` 两篇站点文章。
- Anvil Quest 平台构建仍生成 174 页并保留英中项目 landing、营销入口与原有内容；产物未出现 Wardogs 品牌、slug 或专属战术文本，证明 `projectLanding` 开关和内容隔离可按站点独立工作。
- Wardogs 的现有门禁全部可复用：配置一致性、2 篇 MDX 内容检查、139/139 UI key 严格检查均通过；日文文章缺失继续按原有英文 fallback 规则处理。
- `gen-covers --out` 在 `SITE_ID=wardogs` 下只扫描该站两篇内容并生成两个封面，且自定义输出目录不改 frontmatter，证明作者脚本已切换到 active site。
- Wardogs 桌面浏览器验收确认品牌、tactical 主题、首页覆盖和公共区块组合正常；375x812 视口下 document/body `scrollWidth` 均为 375、主内容无横向溢出，页面中 `/landing/` 入口数量为 0，控制台无 warning/error。
- 平台开发模式也已拦截项目营销页：首页响应 200，`/landing/` 与 `/zh/landing/` 响应 404，与 Wardogs 静态产物保持一致。

## 2026-09-22 Wardogs 内容复刻
- 线上公开 Sitemap 列出 30 个 URL，包括首页、武器、三张地图、攻略、更新、路线图和情报页；当前本地站点只有两篇示例 MDX。
- 线上响应是 Next.js 静态/缓存页面，公共 URL 可读取；`robots.txt` 允许抓取并指向 Sitemap。
- 当前本地 `FIELDKIT` 兑换码、东侧 relay/depot 路线等示例内容没有线上对应依据，须替换。
- 复刻设计方向选 Industrial / Utilitarian：战术字标、紧凑导航、深色面板、橙色行动色；首页以可检索的武器/地图情报为视觉锚点，保持高密度扫描体验。
- 原站 29 篇专题 URL 均为根路径；共享文章路由必须在 Wardogs 的 flat 模式下按 slug 找回分类，同时侧栏路径也需同步，否则会产生 `/guides/<slug>/` 死链。
- 线上武器库 33 条、三张地图地点 60/55/56 条均是版本受限的社区测试记录；首页和详情页需显式标记，而不能以当前正式版数值呈现。
- 旧 Astro dev 服务在新内容导入后仍持有旧 `getStaticPaths` 列表，首页热更新正常但新根路径返回 404；重启服务后恢复 200，静态构建始终生成正确路径。
- 根 `wrangler.toml` 的 SITE_URL 属默认站；多站模式没有显式 SITE_URL 时，check-config 应使用所选站点配置域名，不读取默认站 Wrangler 值。
