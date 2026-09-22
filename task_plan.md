# 多站点平台首期实施计划

## 目标
在不拆分现有 Astro 核心包的前提下，实现两个站点通过 `SITE_ID` 选择独立配置、内容、首页区块、主题、静态资源与 Cloudflare Pages 构建，并支持首页特殊覆盖。

## 当前阶段
Phase 7 complete

## 明确不做
- 不新增完整 `SITE_ID` 白名单与友好错误体系，仅保留最低字符安全约束。
- 不新增 secrets 配置分层或泄漏扫描。
- 不为首页区块增加 Zod 校验与数据源存在性门禁。
- 不新增 Canonical、内部链接、Sitemap、robots 和移动端专项门禁；保留现有生成逻辑。
- 不拆分七个 workspace 包，不实现选择性 CI、迁移器、监控面板或任意页面覆盖。

## 阶段

### Phase 1：核验导入面与确定兼容设计
- [x] 完成现状核验与兼容方案
- **Status:** complete

### Phase 2：实现站点上下文、配置别名和资源物化
- [x] 完成构建期站点选择与 public 隔离
- **Status:** complete

### Phase 3：迁移两个站点的配置、内容与本地化数据
- [x] 完成 Anvil Quest 与 Wardogs 站点目录
- **Status:** complete

### Phase 4：实现首页区块渲染、两套主题与首页覆盖
- [x] 完成公共区块、default/tactical 主题与首页 override
- **Status:** complete

### Phase 5：接入构建命令、CI/Pages 使用方式和文档
- [x] 完成作者脚本、双站 CI 和部署说明
- **Status:** complete

### Phase 6：运行类型、测试、双站构建与产物隔离验证
- [x] 完成自动化门禁、产物审计和浏览器验收
- **Status:** complete

### Phase 7：Wardogs 线上内容复刻
- [x] 按公开 Sitemap 核实页面、事实来源与现有 URL
- [x] 导入站点文章及结构化数据，移除虚构示例
- [x] 在现有站点目录实现线上首页主要内容区块与交互
- [x] 保持线上 URL 可访问，验证站点构建和内容隔离
- **Status:** complete

## 关键决策
| 决策 | 理由 |
|------|------|
| 保持单 Astro app | 降低首期迁移成本并减少上游同步冲突 |
| 用统一 SiteContext 驱动 Astro/content/页面 | 避免各模块各自解析 `SITE_ID` |
| 特殊覆盖首期只支持首页 | 与已确认的上线范围一致 |
| 复用现有质量能力，不新增专项门禁 | 遵循用户明确收敛后的范围 |
| 保留旧 apply-template 兼容路径 | 避免多站首期同时重写 fork 初始化体系 |
| 未设置 SITE_ID 时保持 legacy 单站模式 | 保护现有 fork CLI 与 E2E；多站 Pages 必须显式设置 SITE_ID |
| 设置 SITE_ID 时由 Vite 精确别名替换 site/nav/routing/locales | 保留现有组件导入 API，缩小改造面 |

## 错误记录
| 错误 | 次数 | 处理 |
|------|------|------|
| 单个补丁同时删除并新增同一路径，apply_patch 拒绝 | 1 | 改为先删除旧评审记录，再用独立补丁创建实施记录 |
| 首次复制默认站内容时目标少了一层 `wiki/` | 1 | 核验目录后将 en/ja 移入 `sites/anvil-quest/content/wiki/`，不重复复制 |
| 批量新增站点文件时 manifest 描述原文与预期不一致，整补丁未应用 | 1 | 将站点代码与 manifest 拆成独立补丁，先读取真实 manifest 再精准修改 |
| 批量替换 locale 时系统 `C.UTF-8` 不可用产生 Perl warning | 1 | Perl 自动回退 `C` 且命令成功；通过 JSON 解析和 typecheck 验证结果 |
| Astro 动态区块组件将判别联合 props 求交为 `never` | 1 | 六个注册组件改收统一 `HomeBlock`，各组件内部按 type 收窄 |
| 旧 home-ui 测试仍假设 HomePage 直接访问 en.json.home，2/318 失败 | 1 | 替换为站点 home.page 与 blockRegistry 接线契约，保留 FAQ/类型门禁 |
| 首次搜索 Astro 7 类型时 zsh 未匹配通配符并报错 | 1 | 使用 `find` 解析精确安装目录后读取公开 integration 类型；确认 build setup 的 pages Map 可过滤路由 |
| `AstroIntegration` 从 `astro/config` 导入导致三处类型错误 | 1 | 按 Astro 公开类型出口改为从 `astro` 导入 |
| 三个 `astro check` 并发争用 `node_modules/.vite`，Wardogs 报 ENOTEMPTY | 1 | 类型修复后改为串行执行三种模式，避免共享 Vite 缓存竞争 |
| 首次 dev 命令多传一层 `--`，`--host` 未生效，浏览器连接被拒 | 1 | 从 Astro 状态/日志确认原因，按 `pnpm dev --host 0.0.0.0` 重启 |
| planning-with-files 完成检查脚本无执行权限 | 1 | 不修改技能目录权限，改用 `bash scripts/check-complete.sh` 调用 |
| 完成检查脚本无法识别中文阶段清单，统计阶段数为 0 | 1 | 将六个阶段改为脚本要求的英文阶段标题与固定完成状态格式 |

## Wardogs 内容复刻决策
| 决策 | 理由 |
|------|------|
| 沿用 `sites/wardogs` 与 Astro 核心 | 遵守用户保留工程结构的要求 |
| 用线上公开内容与来源作为事实依据 | 本地两篇示例含未核实的玩法、兑换码，不能作为生产内容 |
| 视觉方向为 Industrial / Utilitarian，锚点为战术情报面板 | 对齐线上站的高密度战地手册视觉与内容组织 |
| 文章按原站根路径发布，分类索引保持原结构 | 30 个公开 URL 可在新构建中逐一命中，不改变共享内容目录结构 |
| 测试版资料保留版本与来源标记 | 33 条武器记录和 171 个地点不能冒充正式版实测 |
