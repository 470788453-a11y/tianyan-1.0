# 天衍 1.0 GitHub 发布前检查清单（可执行版）

日期：2026-03-23  
用途：作为天衍 1.0 门面版仓库公开前的工程化执行清单  
发布原则：**只发 1.0 门面版，不把全部内部仓库原样公开。**

---

## 0. 使用方式

建议按以下节奏执行：

- 先完成 **P0 一票否决项**
- 再完成 **P1 发布必需项**
- 最后处理 **P2 增强项**

如果 P0 或 P1 有未完成项，不建议发布。

---

## 1. P0 一票否决项

以下任一项未通过，直接停止发布：

- [ ] 公开仓中不存在任何真实 `API Key / Token / Cookie / Session / Webhook URL`
- [ ] 公开仓中不存在任何真实账号标识、文档 token、文件 token、群 ID、聊天数据
- [ ] 公开仓中不存在任何本机绝对路径、用户名、主机名、内网 IP、代理出口信息
- [ ] 公开仓中不存在任何未打码截图、未裁剪录屏、未脱敏日志
- [ ] 公开仓中不存在内部 `memory/`、`state/`、`logs/`、`output/`、`tmp/`、`snapshots/`、`evidence/` 原始目录
- [ ] 公开仓不是从内部母仓直接整仓推送，而是经过导出/裁剪/重建历史的公开仓
- [ ] 仓库首页已明确声明“这是 1.0 门面版，不是全部内部系统”

---

## 2. P1 发布必需项：边界冻结

## 2.1 发布范围冻结

- [ ] 明确本次发布目标：`天衍 1.0 门面版`
- [ ] 明确本次发布不包含：内部母仓全量历史
- [ ] 明确本次发布不包含：真实生产 receipt / evidence / state
- [ ] 明确本次发布不包含：与 1.0 无关的其他项目目录
- [ ] 明确本次发布不包含：个人工作台目录污染与本机目录映射
- [ ] 产出一份“纳入公开清单”
- [ ] 产出一份“禁止公开清单”

### 建议的禁止公开清单最少覆盖

- [ ] `.openclaw/`
- [ ] `.ssh/`
- [ ] `.ollama/`
- [ ] `.android/`
- [ ] `memory/`
- [ ] `state/`
- [ ] `logs/`
- [ ] `output/`
- [ ] `tmp/`
- [ ] `snapshots/`
- [ ] `receipts/` 原始目录
- [ ] `evidence/` 原始目录
- [ ] `Desktop/`、`Documents/`、`Contacts/`、`3D Objects/`
- [ ] 无关项目目录

## 2.2 公开仓生成方式

- [ ] 新建独立公开导出目录，例如 `export/tianyan-1.0/`
- [ ] 从内部仓只复制允许公开的文件
- [ ] 不在原始母仓上直接删改后 push
- [ ] 公开仓使用全新 Git 历史，或已确认历史完全脱敏

---

## 3. P1 发布必需项：代码 / 配置脱敏

## 3.1 代码级脱敏

- [ ] 搜索并清理所有硬编码凭据
- [ ] 搜索并清理所有硬编码内网地址
- [ ] 搜索并清理所有个人用户名、设备名、主机名
- [ ] 搜索并清理所有真实第三方资源地址
- [ ] 搜索并清理所有真实 webhook / callback URL
- [ ] 搜索并清理所有真实数据库路径或本地文件路径
- [ ] 搜索并清理所有仅内部使用的 feature flag
- [ ] 删除或替换任何依赖私有环境才能运行的默认代码路径

### 建议重点扫描字段

- [ ] `key`
- [ ] `token`
- [ ] `secret`
- [ ] `cookie`
- [ ] `session`
- [ ] `authorization`
- [ ] `webhook`
- [ ] `callback`
- [ ] `password`
- [ ] `private`
- [ ] `credential`

## 3.2 配置级脱敏

- [ ] 把真实 `.env` 改成 `.env.example`
- [ ] 所有配置文件只保留 example/default/schema
- [ ] 删除真实 provider 配置
- [ ] 删除真实浏览器 profile / relay / gateway 地址
- [ ] 删除真实联系人、聊天对象、租户、空间、文档 ID
- [ ] 删除真实 cron、运维、巡检目标
- [ ] 删除真实证据 intake 和外部回执关联信息

## 3.3 文档级脱敏

- [ ] 文档内不再出现真实账号名、邮箱、手机号、ID
- [ ] 文档内不再出现真实文档链接、真实后台链接、真实工作台链接
- [ ] 文档内不再出现真实回执路径与内部调查线索
- [ ] 文档内不再出现不该公开的组织内部术语或治理细节
- [ ] 所有代码块、配置块、截图示例均完成脱敏

## 3.4 素材级脱敏

- [ ] 所有 screenshot 完成裁剪或打码
- [ ] 所有 gif 不暴露个人头像、联系人、通知、书签、浏览器账号信息
- [ ] 所有 video 不暴露系统托盘、聊天弹窗、桌面文件、浏览器账号状态
- [ ] 检查图片 EXIF/元数据，必要时移除

---

## 4. P1 发布必需项：文档最小完备度

如果以下文档不齐，外部用户基本无法正确理解 1.0 门面版。

## 4.1 根级文档

- [ ] `README.md`
- [ ] `LICENSE`
- [ ] `CONTRIBUTING.md`
- [ ] `SECURITY.md`
- [ ] `.gitignore`
- [ ] `CHANGELOG.md`

## 4.2 README 最小内容

- [ ] 一句话说明：天衍 1.0 是什么
- [ ] 两到三段说明：解决什么问题
- [ ] 明确说明：这是公开门面版，不是内部全量系统
- [ ] 说明仓库主要目录作用
- [ ] 提供最小安装/运行步骤
- [ ] 提供最小 demo 入口
- [ ] 提供已知限制 / 非目标
- [ ] 提供 issue / PR 指引
- [ ] 提供许可证说明

## 4.3 docs 最小内容

- [ ] `docs/architecture-overview.md`
- [ ] `docs/scope-boundary.md`
- [ ] `docs/quickstart.md`
- [ ] `docs/faq.md`
- [ ] `docs/roadmap.md`
- [ ] `docs/demo/demo-script.md`

### 其中必须写清楚的 6 件事

- [ ] 系统目标
- [ ] 最小主干结构
- [ ] 如何跑起 demo
- [ ] 什么是公开范围
- [ ] 什么不在公开范围内
- [ ] 当前版本有哪些限制

---

## 5. P1 发布必需项：demo / screenshot / gif / video 物料清单

公开仓第一次发布，文档再好，没有演示物料也会显得空。

## 5.1 最低配物料

- [ ] Hero 截图 1 张：仓库首页或核心界面
- [ ] 功能截图 2~4 张：展示关键能力切面
- [ ] gif 1 个：15~30 秒，展示最小主流程
- [ ] 演示视频 1 个：60~120 秒，最好无废话版
- [ ] 架构图 1 张：让人理解模块边界
- [ ] `docs/demo/demo-script.md`：说明每个演示步骤做什么

## 5.2 推荐物料命名

- [ ] `docs/demo/screenshots/home.png`
- [ ] `docs/demo/screenshots/workflow.png`
- [ ] `docs/demo/gifs/minimal-flow.gif`
- [ ] `docs/demo/videos/tianyan-1.0-overview.mp4`
- [ ] `docs/diagrams/architecture-overview.png`

## 5.3 物料质量要求

- [ ] 截图主题统一，不要一半深色一半浅色、风格割裂
- [ ] gif 不要太长，不要超过 30 秒
- [ ] 视频优先展示“从零到结果”的最短链路
- [ ] 所有物料与当前 README 文案保持一致
- [ ] 演示物料不展示内部版功能，不制造“公开仓功能比实际更多”的误导

---

## 6. P1 发布必需项：GitHub 仓库治理准备

## 6.1 基础治理文件

- [ ] `.github/ISSUE_TEMPLATE/bug_report.yml`
- [ ] `.github/ISSUE_TEMPLATE/feature_request.yml`
- [ ] `.github/ISSUE_TEMPLATE/question.yml`
- [ ] `.github/ISSUE_TEMPLATE/config.yml`
- [ ] `.github/pull_request_template.md`
- [ ] `CODEOWNERS`

## 6.2 仓库设置

- [ ] 仓库描述已填写
- [ ] Topics 已配置
- [ ] 默认分支命名已确定
- [ ] Issues 已开启
- [ ] Discussions 是否开启已决定
- [ ] Wiki 是否开启已决定
- [ ] Security policy 已配置
- [ ] README 首屏展示效果已检查

## 6.3 CI / 检查流

- [ ] 至少有 1 条 CI：基础 lint / build / smoke
- [ ] 至少有 1 条 release-check：检查文档/示例/必要文件是否齐全
- [ ] 至少有 1 条 docs 检查：避免 README / docs 死链

---

## 7. P1 发布必需项：GitHub 发布步骤

建议按下面顺序执行，不要乱序。

## 7.1 发布前一天或发布当日

- [ ] 冻结发布范围，不再往公开仓塞新模块
- [ ] 冻结 README 文案
- [ ] 冻结 demo 物料
- [ ] 冻结对外术语：统一叫“天衍 1.0 门面版”
- [ ] 统一版本号：如 `v1.0.0`

## 7.2 导出与清洗

- [ ] 从内部母仓导出公开白名单文件
- [ ] 重新检查 `.gitignore`
- [ ] 重新执行 secrets scan
- [ ] 重新执行截图/视频脱敏复查
- [ ] 删除所有无关目录
- [ ] 检查公开仓根目录是否仍然简洁

## 7.3 最终本地验证

- [ ] 新机器视角或干净目录视角跑一次 quickstart
- [ ] 至少跑一次最小 smoke
- [ ] 至少验证一次 README 中每条命令可执行
- [ ] 至少验证一次 demo-script 中每步可复现
- [ ] 检查所有相对路径、图片路径、文档链接有效

## 7.4 GitHub 上线动作

- [ ] 创建 GitHub 仓库
- [ ] 推送首发内容
- [ ] 设置仓库描述、Topics、主页链接
- [ ] 补齐 Issue Template / Security / PR Template
- [ ] 打 `v1.0.0` 标签
- [ ] 创建首个 Release Note
- [ ] 在 Release 中放入：版本说明、已知限制、下一步计划、Demo 链接

## 7.5 上线后 1 小时内复查

- [ ] README 在 GitHub 页面渲染正常
- [ ] 图片、gif、视频链接正常
- [ ] Release 页面显示正常
- [ ] Issues 模板可用
- [ ] Quickstart 没有明显漏项
- [ ] 外部用户第一眼不会误解为“全量内部仓”

---

## 8. P2 增强项：建议补但不阻塞首发

- [ ] `docs/known-limitations.md`
- [ ] `docs/use-cases.md`
- [ ] `docs/terminology.md`
- [ ] `docs/migration-notes.md`
- [ ] `docs/public-roadmap-90d.md`
- [ ] 录制一条无字幕版短视频 + 一条带讲解版视频
- [ ] 提供英文版 README 或最小英文摘要
- [ ] 提供 architecture SVG 源文件
- [ ] 补一份 `TRADEMARK.md`
- [ ] 补一份 `THIRD_PARTY_NOTICES.md`

---

## 9. 发布后 7 天维护动作

## Day 0（发布当天）

- [ ] 观察 GitHub 首页访问、星标、issue、discussion
- [ ] 记录首批外部误解点
- [ ] 若 README 首屏有歧义，当天修正文案

## Day 1

- [ ] 整理首批外部问题
- [ ] 标记：文档问题 / 演示问题 / 安装问题 / 范围误解问题
- [ ] 处理最容易导致流失的 onboarding 问题

## Day 2~3

- [ ] 产出首批 FAQ 增补
- [ ] 补一轮 README 小修
- [ ] 补一轮 quickstart 小修
- [ ] 如果 demo 误导，立即换图或重录 gif

## Day 4~5

- [ ] 整理 issue 优先级：P0 / P1 / P2
- [ ] 决定是否发 `v1.0.1`
- [ ] 若出现“公开范围误解”，强化 `scope-boundary.md`

## Day 6~7

- [ ] 复盘首周反馈
- [ ] 汇总最常见的 5 个问题
- [ ] 判断是否进入 `1.0.1` 文档修正版
- [ ] 判断是否进入 `1.1` 能力增强版规划
- [ ] 记录哪些内部资产仍不适合公开，防止后续越界扩面

---

## 10. 首发最值得优先执行的事项

如果现在只抓最关键的事，优先级建议如下：

### 第一优先级：先做“公开导出仓”

- [ ] 不要直接推内部母仓
- [ ] 先新建一个干净公开仓目录
- [ ] 只放 1.0 门面版需要的东西

### 第二优先级：先做“脱敏清扫”

- [ ] 先扫 secrets
- [ ] 先扫真实路径与真实 ID
- [ ] 先扫截图/录屏中的隐私

### 第三优先级：先补“最小文档闭环”

- [ ] README
- [ ] quickstart
- [ ] scope-boundary
- [ ] architecture-overview
- [ ] demo-script

### 第四优先级：先补“最小演示物料”

- [ ] 3 张截图
- [ ] 1 个 gif
- [ ] 1 个 60~120 秒视频

这四步做完，天衍 1.0 的 GitHub 首发就基本具备工程化落地条件。

---

## 11. 最终发布门槛

只有当下面 4 条全部满足，才建议正式公开：

- [ ] 仓库已经是门面版而不是内部母仓
- [ ] 脱敏已经完成并复检通过
- [ ] 外部用户可以靠 README + quickstart 跑起最小 demo
- [ ] 发布后 7 天的维护动作有人接得住

如果这 4 条没同时满足，建议继续准备，不要急着发。
