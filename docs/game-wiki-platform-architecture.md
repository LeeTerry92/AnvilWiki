# 游戏 Wiki 批量建站平台架构

## 1. 文档目标

本文定义一套基于 AnvilWiki 的批量游戏站建设方案，用于支持每周持续上线新游戏站，并解决以下问题：

- 所有站点共享一套核心框架，避免复制代码后产生大量分支。
- 每个站点拥有独立的域名、内容、配置、构建产物和部署环境。
- 不同游戏可以自由组合首页内容，并拥有不同的视觉风格。
- 特殊游戏可以覆盖默认页面，但仍复用公共组件和基础设施。
- 框架修复、安全更新和功能升级能够批量应用到所有站点。

核心原则：

> 一套核心框架 + 多份站点配置和内容 + 页面区块化 + 特殊页面覆盖 + 每站独立构建部署。

这是一种“构建期多租户”模式。代码在开发阶段共享，构建时根据 `SITE_ID` 选择站点，最终生成相互独立的静态网站。

---

## 2. 总体架构

```text
                         AnvilWiki 上游
                               |
                         定期同步与评估
                               |
                    内部维护的 wiki-core
                               |
          +--------------------+--------------------+
          |                    |                    |
    公共 UI 组件         页面区块注册表        SEO/构建工具
          |                    |                    |
          +--------------------+--------------------+
                               |
                      站点配置与内容目录
                               |
              +----------------+----------------+
              |                |                |
          wardogs          game-two         game-three
              |                |                |
          独立构建          独立构建          独立构建
              |                |                |
       Cloudflare Pages  Cloudflare Pages  Cloudflare Pages
              |                |                |
          独立域名          独立域名          独立域名
```

平台共享：

- Astro、MDX、搜索、多语言、SEO、广告和统计基础设施。
- Hero、攻略列表、武器库、角色列表、Tier List、地图等页面区块。
- 内容 Schema、链接检查、图片检查和构建脚本。
- CI/CD、质量门禁和部署工具。

站点隔离：

- 品牌、域名、语言、导航和功能开关。
- 首页结构、主题变量、内容和结构化游戏数据。
- 构建产物、Cloudflare Pages 项目、缓存、统计和回滚。

---

## 3. 推荐仓库结构

推荐使用 pnpm workspace 管理单一代码库：

```text
game-wiki-platform/
├── apps/
│   └── wiki/
│       ├── src/
│       │   ├── layouts/
│       │   ├── pages/
│       │   └── styles/
│       ├── astro.config.ts
│       └── package.json
│
├── packages/
│   ├── wiki-core/              # 基于 AnvilWiki 维护的核心能力
│   ├── ui-components/          # 通用基础组件
│   ├── home-blocks/            # 可组合的首页区块
│   ├── page-renderer/          # 配置驱动的页面渲染器
│   ├── site-schema/            # 站点和页面配置的 Zod Schema
│   ├── seo-tools/              # Sitemap、JSON-LD、索引检查
│   └── create-site/            # 新站点脚手架和部署命令
│
├── sites/
│   ├── wardogs/
│   │   ├── site.config.ts
│   │   ├── home.page.ts
│   │   ├── navigation.ts
│   │   ├── content/
│   │   ├── data/
│   │   ├── components/
│   │   ├── pages/
│   │   └── public/
│   ├── game-two/
│   └── game-three/
│
├── tests/
├── scripts/
├── pnpm-workspace.yaml
└── package.json
```

### 3.1 分层职责

| 层级 | 负责内容 | 是否允许站点直接修改 |
|---|---|---:|
| `wiki-core` | AnvilWiki 核心、路由、内容管线、搜索和 SEO | 否 |
| `ui-components` | 按钮、卡片、导航、标签等基础 UI | 否 |
| `home-blocks` | Hero、攻略、武器、地图等业务区块 | 原则上否 |
| `site-schema` | 配置和数据校验规则 | 否 |
| `sites/<id>` | 某个游戏的配置、内容、数据和素材 | 是 |
| `sites/<id>/components` | 该游戏专属组件 | 是 |
| `sites/<id>/pages` | 特殊页面覆盖 | 是，但应谨慎使用 |

---

## 4. 站点配置化

每个游戏站必须拥有独立的 `site.config.ts`：

```ts
export default {
  id: "wardogs",
  name: "War Dogs Wiki",
  domain: "www.wardogs.top",
  locale: "zh-CN",
  theme: "tactical",
  features: {
    weaponDatabase: true,
    interactiveMap: true,
    videoChapters: true,
    comments: false,
  },
  analytics: {
    provider: "cloudflare",
  },
};
```

配置至少应覆盖：

- 站点标识、名称、域名和默认语言。
- Logo、图标、社交分享图和品牌信息。
- 导航、页脚、内容分类和首页布局。
- 搜索、评论、广告、地图等功能开关。
- Analytics、Search Console 和 IndexNow 配置。
- Canonical、Sitemap、robots 和结构化数据设置。

配置必须通过 Zod Schema 校验，禁止在运行或部署阶段才发现缺少字段。

---

## 5. 首页区块化

所有游戏共享首页渲染能力，但不共享固定首页内容。首页拆分为可复用区块，每个站点自行决定区块的选择、顺序、数据源和视觉变体。

建议首批提供以下区块：

```text
VideoHero          视频 Hero
ImageHero          图片 Hero
AnnouncementBar    公告栏
PatchTimeline      版本更新时间线
GuideGrid          攻略列表
WeaponExplorer     武器搜索和筛选
WeaponCarousel     武器轮播
CharacterGrid      角色列表
TierList           强度榜
CodeList           兑换码
InteractiveMap     交互地图
VideoGrid          视频攻略
FaqSection         常见问题
AdSlot             广告位
```

### 5.1 射击游戏首页示例

```ts
export default {
  layout: "tactical",
  sections: [
    {
      type: "video-hero",
      title: "War Dogs",
      video: "/videos/hero.mp4",
      poster: "/images/hero.webp",
    },
    {
      type: "patch-timeline",
      source: "patches",
      limit: 5,
    },
    {
      type: "weapon-explorer",
      source: "weapons",
      categories: ["突击步枪", "狙击枪", "冲锋枪"],
    },
    {
      type: "interactive-map",
      source: "locations",
    },
    {
      type: "guide-grid",
      category: "战术攻略",
      limit: 8,
    },
  ],
};
```

### 5.2 角色扮演游戏首页示例

```ts
export default {
  layout: "fantasy",
  sections: [
    {
      type: "image-hero",
      title: "冒险者指南",
      image: "/images/world.webp",
    },
    {
      type: "character-grid",
      source: "characters",
      featured: true,
    },
    {
      type: "tier-list",
      source: "character-tier-list",
    },
    {
      type: "guide-grid",
      category: "新手攻略",
      limit: 6,
    },
    {
      type: "video-grid",
      category: "Boss 攻略",
      limit: 4,
    },
  ],
};
```

### 5.3 区块注册表与渲染器

公共注册表将配置中的 `type` 映射到 Astro 组件：

```ts
import VideoHero from "./VideoHero.astro";
import ImageHero from "./ImageHero.astro";
import GuideGrid from "./GuideGrid.astro";
import WeaponExplorer from "./WeaponExplorer.astro";
import InteractiveMap from "./InteractiveMap.astro";

export const blockRegistry = {
  "video-hero": VideoHero,
  "image-hero": ImageHero,
  "guide-grid": GuideGrid,
  "weapon-explorer": WeaponExplorer,
  "interactive-map": InteractiveMap,
};
```

通用首页渲染器读取当前站点的首页配置：

```astro
---
import { blockRegistry } from "./blockRegistry";
import homePage from "@site/home.page";

const sections = homePage.sections;
---

{
  sections.map((section) => {
    const Component = blockRegistry[section.type];
    return <Component {...section} />;
  })
}
```

每一种区块配置都应使用判别联合类型和 Zod Schema 校验。未知的 `type`、不合法的数据源和缺少的必要属性必须在构建阶段报错。

---

## 6. 三级定制机制

### 6.1 第一级：内容和顺序不同

组件、布局和交互相同，仅内容来源或排列不同，通过 `home.page.ts` 解决。这应该覆盖大多数新站点。

```ts
{
  type: "guide-grid",
  category: "新手攻略",
  limit: 8,
}
```

### 6.2 第二级：视觉变体不同

组件功能相同，但根据游戏类型选择不同外观：

```ts
{
  type: "guide-grid",
  variant: "tactical",
}
```

建议提供少量经过测试的主题和区块变体：

```text
default
tactical
fantasy
sci-fi
minimal
editorial
```

站点主题通过 CSS 变量控制：

```css
:root {
  --color-primary: #d4b14c;
  --color-surface: #121514;
  --font-display: "Rajdhani";
  --card-radius: 2px;
}
```

主题应控制颜色、字体、间距、圆角和背景，不应复制整个组件。

### 6.3 第三级：特殊页面覆盖

当某个游戏首页结构高度特殊时，可以增加：

```text
sites/special-game/pages/index.astro
```

该文件覆盖通用首页，但继续复用公共组件：

```astro
---
import VideoHero from "@platform/home-blocks/VideoHero.astro";
import GuideGrid from "@platform/home-blocks/GuideGrid.astro";
import CharacterMatrix from "../components/CharacterMatrix.astro";
---

<VideoHero />
<CharacterMatrix />
<GuideGrid />
```

推荐控制比例：

- 约 70% 使用公共区块。
- 约 20% 使用主题和区块变体。
- 约 10% 使用站点专属组件。
- 只有极少数站点使用完整页面覆盖。

禁止在公共首页中持续增加 `if (siteId === "...")` 条件。站点差异必须进入配置、变体、专属组件或覆盖页面。

---

## 7. 内容与数据组织

不同类型的数据应采用不同的管理方式：

| 数据类型 | 推荐位置 | 推荐格式 |
|---|---|---|
| 攻略、新闻、版本更新、FAQ | `content/` | MDX |
| 武器、角色、地点、任务 | `data/` | TypeScript 或 JSON |
| Logo、图标、小型图片 | `public/` | SVG、WebP、AVIF |
| 大地图、视频、大型图库 | 对象存储/CDN | WebP、AVIF、MP4 |
| 站点专属交互组件 | `components/` | Astro/TypeScript |

结构化游戏数据不应拆成大量难以维护的 MDX 文件。大型媒体也不应全部提交到 Git 仓库。

---

## 8. 独立构建与部署

每个站点使用相同代码库，通过 `SITE_ID` 独立构建：

```bash
SITE_ID=wardogs pnpm build
SITE_ID=game-two pnpm build
```

每个站点对应一个独立的 Cloudflare Pages 项目：

| 项目 | 环境变量 | 域名 |
|---|---|---|
| `wiki-wardogs` | `SITE_ID=wardogs` | `www.wardogs.top` |
| `wiki-game-two` | `SITE_ID=game-two` | 对应独立域名 |
| `wiki-game-three` | `SITE_ID=game-three` | 对应独立域名 |

独立部署带来的收益：

- 一个站点发布失败不会阻塞其他站点。
- 每个站点可以独立预览、回滚和清理缓存。
- 各站点的域名、统计、广告和环境变量相互隔离。
- 修改某站内容时无需重新部署全部站点。

不建议根据请求的 `Host` 在同一个运行时应用中动态切换站点。该方式会扩大故障范围，并增加缓存、Canonical、Sitemap、robots 和回滚管理的复杂度。

---

## 9. 每周上站标准流程

### 9.1 创建站点

提供统一脚手架：

```bash
pnpm create-site
```

脚手架收集：

```text
游戏名称
站点代号
正式域名
默认语言
主题模板
首页区块
功能开关
统计与广告配置
```

自动生成：

```text
sites/new-game/
├── site.config.ts
├── home.page.ts
├── navigation.ts
├── content/
│   ├── guides/
│   ├── news/
│   └── faq/
├── data/
│   ├── characters.json
│   ├── weapons.json
│   └── locations.json
├── components/
└── public/
```

### 9.2 上线步骤

1. 创建站点目录和基础配置。
2. 选择首页区块、主题和功能开关。
3. 导入 Logo、图片、地图和视频素材。
4. 批量导入攻略和结构化游戏数据。
5. 执行配置、内容和数据 Schema 校验。
6. 构建本地预览并检查桌面端、移动端。
7. 自动检查链接、图片、SEO 和结构化数据。
8. 创建独立 Cloudflare Pages 项目。
9. 配置 `SITE_ID`、域名和站点环境变量。
10. 发布预览环境并人工验收。
11. 发布正式环境并提交 Sitemap、IndexNow。
12. 检查 404、性能、搜索、广告和统计事件。

目标命令：

```bash
pnpm create-site
pnpm validate --site new-game
pnpm preview --site new-game
pnpm deploy --site new-game
```

---

## 10. CI/CD 规则

流水线应根据变更范围选择构建对象：

| 变更内容 | 构建范围 |
|---|---|
| 某个站点的内容、数据或素材 | 仅该站点 |
| 某个主题 | 使用该主题的站点 |
| 某个可选区块 | 使用该区块的站点 |
| 公共 UI 或 SEO 核心 | 全部站点 |
| 实验性功能 | 开启该功能的站点 |

质量门禁至少包括：

```text
TypeScript 类型检查
配置和数据 Schema 校验
MDX 编译检查
内部链接和图片检查
重复标题与描述检查
Canonical 检查
Sitemap 和 robots 检查
JSON-LD 校验
桌面端和移动端截图回归
Lighthouse 性能检查
关键交互端到端测试
```

站点数量增加后，禁止每次变更都无条件构建全部站点。

---

## 11. 框架维护与升级

AnvilWiki 应由内部 Fork 集中维护，不应复制到各站点后分别修改：

```text
AnvilWiki 上游
      |
      v
内部 wiki-core
      |
      v
版本化发布
      |
      v
所有游戏站构建
```

内部版本采用语义化版本：

```text
1.8.2  Bug 修复
1.9.0  向后兼容的新功能
2.0.0  配置、数据或组件接口存在破坏性变更
```

升级流程：

1. 定期检查 AnvilWiki 上游 Release 和安全更新。
2. 在内部维护分支同步更新并解决冲突。
3. 执行单元测试、全量构建和浏览器测试。
4. 首先发布到内部测试站。
5. 再发布到两个低流量站点进行灰度验证。
6. 检查 SEO、广告、搜索和统计是否正常。
7. 批量升级其余站点。
8. 保留前一版本构建产物和快速回滚能力。

破坏性配置变更必须提供迁移脚本，例如：

```bash
pnpm migrate-sites --from 1.x --to 2.0
```

---

## 12. 仓库拆分边界

默认采用单仓库。当出现以下情况时，可以将站点拆为独立仓库：

- 站点有独立客户、团队或代码权限边界。
- 站点需要独立后端、账号、支付或商业系统。
- 站点功能已经明显偏离公共框架。
- 站点发布节奏与平台完全不同。
- 存在明确的数据合规或保密要求。

独立仓库仍应依赖共享包，而不是复制源码：

```json
{
  "dependencies": {
    "@company/wiki-core": "^1.9.0",
    "@company/wiki-components": "^2.3.0"
  }
}
```

规模建议：

| 站点数量 | 推荐模式 |
|---:|---|
| 1～10 | 单仓库，站点目录隔离 |
| 10～50 | 单仓库，脚手架建站，选择性构建 |
| 50～200 | 框架与内容分离，版本化共享包 |
| 高度定制站 | 独立仓库，但继续依赖共享核心 |

---

## 13. 禁止事项

- 禁止为每个游戏复制完整 AnvilWiki 源码。
- 禁止站点直接修改 `wiki-core` 和公共组件实现。
- 禁止在公共组件中堆积大量 `siteId` 条件判断。
- 禁止仅通过复制 CSS 创建新的主题。
- 禁止将全部站点部署成无法独立回滚的单一运行时应用。
- 禁止未经过 Schema 校验的任意 JSON 配置进入生产构建。
- 禁止大型地图、视频和图库长期存放在 Git 仓库。
- 禁止公共框架升级后未经灰度验证直接全量发布。

---

## 14. 落地优先级

### 第一阶段：可批量上站

- 整理内部 `wiki-core`。
- 建立 `sites/<id>` 配置和内容目录。
- 支持 `SITE_ID` 独立构建。
- 完成基础首页区块注册表和渲染器。
- 建立至少两种主题。
- 接入独立 Cloudflare Pages 部署。

### 第二阶段：自动化与质量保障

- 开发 `create-site` 脚手架。
- 增加配置、内容和游戏数据 Schema。
- 建立选择性构建流水线。
- 增加 SEO、链接和结构化数据检查。
- 增加浏览器截图与关键交互测试。

### 第三阶段：规模化维护

- 建立框架版本和迁移机制。
- 增加批量升级和灰度发布。
- 将大型媒体迁移至对象存储/CDN。
- 建立站点状态、构建版本和流量监控面板。
- 站点数量较多后评估框架与内容仓库分离。

---

## 15. 最终决策

批量游戏 Wiki 平台采用以下架构：

> AnvilWiki 内部 Fork + pnpm Monorepo + 构建期多租户 + 页面区块化 + 站点配置化 + 特殊页面覆盖 + 每站独立 Cloudflare Pages 部署。

该方案既允许不同游戏拥有完全不同的首页内容和视觉表现，又能让 SEO、搜索、广告、数据校验、部署流水线和框架升级保持统一。
