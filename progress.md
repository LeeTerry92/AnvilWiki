# 多站点平台实施进度

## 2026-09-21

### 阶段 1：兼容设计
- 状态：完成
- 已完成：确认用户收敛范围；决定保留单 Astro app、引入统一 SiteContext、首页级覆盖，并保留旧 apply-template 兼容路径；核验 i18n 静态导入、MDX 图片相对路径、public 混合资产和关键脚本耦合。
- 修改文件：`task_plan.md`、`findings.md`、`progress.md`。

### 阶段 2：站点上下文和资源物化
- 状态：完成
- 已完成：新增 SiteContext、prepare-site、动态 Astro/content 根目录、平台别名、主题标记与 tactical CSS；建立 anvil-quest/wardogs 站点骨架和独立内容。

### 阶段 3：两个站点迁移
- 状态：完成
- 已完成：复制 anvil-quest 的配置/内容/资源/locales；新增 wardogs 的独立配置、导航、locales、manifest 和两篇内容；平台 public 改为站点自有。

### 阶段 4：首页区块和覆盖
- 状态：完成
- 已完成：新增六类区块、BlockRenderer、default/tactical 主题；anvil-quest 使用区块模式，wardogs 使用复用公共区块的 override；三模式类型检查与双站构建通过。

### 阶段 5：构建、CI 与部署说明
- 状态：完成
- 已完成：增加站点级 `projectLanding` 开关与平台构建路由过滤；Wardogs 不再生成 AnvilWiki 营销页或显示其入口；增加双站 CI matrix；新增 `docs/platform-sites.md` 并加入文档索引；修正站点 locale schema 相对路径和 Wardogs 品牌分享图源文件。

### 阶段 6：最终验证
- 状态：完成
- 已完成：重新生成并目检 Wardogs 1200x630 WebP；重新 prepare 后确认物化 public 只有该站资源和共享 `_headers`。
- 已完成：lint 通过；21 suites / 319 tests 全绿；legacy、anvil-quest、wardogs 三模式 typecheck 均 0 error；Wardogs 完整构建 38 页并通过 landing、品牌、内容、public 隔离检查。
- 已完成：Anvil Quest 完整构建 174 页；项目 landing 保留，Wardogs 品牌和内容未泄漏。
- 已完成：Wardogs `check-config`、`check-content`、`check-i18n --strict-ui` 通过；`gen-covers --out` 只为该站两篇文章生成封面且未修改内容源。
- 已完成：桌面和 375x812 移动视口验收；无横向溢出、无营销入口、无浏览器 warning/error；开发环境项目 landing 返回 404；最终 lint、321 tests、Wardogs typecheck/build 与 diff check 全绿；Wardogs 开发服务已恢复运行。

## 验证记录
| 检查 | 状态 | 结果 |
|------|------|------|
| 工作区基线 | 完成 | 保留用户已有 `.github/FUNDING.yml` 删除和未跟踪架构文档 |

## 错误日志
| 时间 | 错误 | 处理 |
|------|------|------|
| 2026-09-21 | apply_patch 不允许同一补丁同时删除并新增同一路径 | 分为两个补丁完成实施计划初始化 |
| 2026-09-21 | `cp -R` 将默认站内容落在 `content/en` 而非 `content/wiki/en` | 目录核验后改为移动现有副本到正确层级 |
| 2026-09-21 | wardogs manifest 的描述文本与补丁上下文不一致 | 整个补丁未生效；拆分站点代码与 manifest 修改 |
| 2026-09-21 | Perl 报告系统 `C.UTF-8` locale 不可用 | 自动回退 `C`，等待 JSON/类型检查确认批量替换有效 |
| 2026-09-21 | `BlockRenderer` 动态组件的 block prop 被推导为 `never` | 统一注册组件 props 类型并在组件内判别收窄 |
| 2026-09-21 | `tests/home-ui.test.ts` 两条旧首页扫描断言失败 | 首页数据源已迁至站点配置，测试改验配置和注册表接线 |
| 2026-09-21 | zsh 对 Astro 安装目录通配符报 `no matches found` | 改用 `find` 获取精确目录，确认 `astro:build:setup` API |
| 2026-09-21 | `AstroIntegration` 错从 `astro/config` 导入 | 改为 Astro 7 的公开 `astro` 类型出口 |
| 2026-09-21 | 并行三模式 `astro check` 争用 Vite 缓存导致 `ENOTEMPTY` | 后续改为串行验证；CI matrix 位于独立 runner，不存在该竞争 |
| 2026-09-21 | `pnpm dev -- --host ...` 让 Astro 忽略 host 参数，内置浏览器连接被拒 | 改用 `pnpm dev --host 0.0.0.0 --port 4321` 重启 |
| 2026-09-21 | planning-with-files `check-complete.sh` 无执行权限 | 保持技能文件不变，使用 `bash` 执行最终检查 |

## 2026-09-22 Wardogs 内容复刻
- 状态：完成。
- 核实线上 30 个公开 URL；将其中 29 篇专题导入 `sites/wardogs/content/wiki/en/`，删除两篇虚构示例，补来源、版本提示、FAQ、关联阅读以及路线图/时间线/视频索引。
- 提取并落盘 33 条社区测试版武器记录、Bakurani/Ozeti/Zestafona 的 60/55/56 个历史地点和页面图片；文章内提供武器搜索/分类与地图地点搜索/缩放。
- 首页覆盖补齐战术 Hero、更新情报、武器预览、地图、视频章节、路线图、专题导航、FAQ 与来源区。共用页头页脚使用站点字标，独立 FAQ 页移除 Roblox、虚构工作室和兑换码事实。
- `articlePathMode: flat` 保持线上根路径，分类索引仍可用；修正侧栏详情链接。导入器显式 `--refresh` 才允许覆盖带标记快照。
- Wardogs 构建 90 页、源 Sitemap 30/30 URL 命中、3916 条内部链接全通；anvil-quest 构建 174 页；Wardogs 类型检查 0 错误，21 套件/322 测试通过，配置/内容/i18n 检查通过。
- 浏览器验收首页、武器搜索（A-91 缩至 1/33）和 Bakurani 地点搜索（Bridge 缩至 1/60）；重启旧开发服务后新根路径返回 200。
- 追加 441px 移动视口首页截图验收：Hero、更新卡片、武器模块均无文字重叠，document/body 宽度均为 441px；页面恢复到首屏并保留本地开发预览。
