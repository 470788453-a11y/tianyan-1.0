# 天衍 1.0 GitHub 仓库结构蓝图（工程化草稿）

日期：2026-03-23  
定位：面向 GitHub 首次公开发布的 **1.0 门面版仓库** 结构建议  
核心原则：**公开的是可理解、可运行、可验证的门面版，不是内部工作母仓的原样镜像。**

---

## 1. 先给结论

天衍 1.0 的 GitHub 仓库不应直接从当前内部工作区整体公开。

当前内部工作区显然更像一个“长期演化母仓 / 操作台 / 个人工作台”，里面混有：

- 多代版本资产
- 内部 runtime / state / receipt / evidence
- 本机目录污染和个人环境耦合目录
- 临时脚本、历史归档、验证残件
- 与 1.0 门面发布无关的项目与资料

因此，建议采用：

1. **新建一个干净的公开导出仓**，不要直接把内部仓库推上 GitHub
2. 只保留 **1.0 必要主干 + 示例 + 文档 + 最小 demo**
3. 所有内部收据、状态、证据、历史 archive、个人目录、真实配置一律不进入公开仓
4. 公开仓目标不是“暴露全部能力”，而是完成以下 4 件事：
   - 让别人看懂天衍 1.0 是什么
   - 让别人能跑起一个最小版本或最小演示
   - 让别人知道边界、限制、后续路线
   - 让后续 issue / PR / demo 演进有干净起点

---

## 2. 建议的公开仓定位

### 2.1 建议名称

可选仓库名：

- `tianyan-1.0`
- `tianyan-core`
- `tianyan-public`

如果只做 1.0 门面版，建议优先：

- **`tianyan-1.0`**

理由：

- 边界清晰，不会让人误以为这是全部内部系统
- 便于后续做 `1.0 -> 1.1 -> 2.0` 公开演进
- 便于把内部仓与公开仓彻底解耦

### 2.2 公开仓一句话定位

建议写成：

> 天衍 1.0 是一个面向复杂任务编排、可观测执行与工程化收口的公开门面版仓库，提供最小可运行骨架、示例、文档与演示材料；不包含全部内部运行资产与私有基础设施。

### 2.3 明确不做什么

公开仓首页和 `docs/scope-boundary.md` 必须显式写死：

- 不公开全部内部自动化资产
- 不公开全部历史仓库结构
- 不公开真实账号、真实工作流、真实凭据、真实生产证据
- 不承诺“内部系统全量复刻”
- 不把当前工作区根目录直接作为开源仓根目录

---

## 3. 建议的目录树

## 3.1 推荐方案：轻量单仓结构

对于 1.0 门面版，不建议一上来做复杂 monorepo。优先单仓轻骨架：

```text
tianyan-1.0/
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  │  ├─ bug_report.yml
│  │  ├─ feature_request.yml
│  │  └─ question.yml
│  ├─ workflows/
│  │  ├─ ci.yml
│  │  ├─ release-check.yml
│  │  └─ docs-link-check.yml
│  ├─ pull_request_template.md
│  └─ CODEOWNERS
├─ docs/
│  ├─ architecture-overview.md
│  ├─ scope-boundary.md
│  ├─ quickstart.md
│  ├─ faq.md
│  ├─ release-notes.md
│  ├─ roadmap.md
│  ├─ security-boundary.md
│  ├─ demo/
│  │  ├─ demo-script.md
│  │  ├─ screenshots/
│  │  ├─ gifs/
│  │  └─ videos/
│  └─ diagrams/
├─ src/
│  ├─ core/
│  ├─ contracts/
│  ├─ adapters/
│  │  └─ public/
│  ├─ guards/
│  └─ cli/
├─ examples/
│  ├─ minimal-config/
│  ├─ sample-runtime/
│  ├─ sample-output/
│  └─ sample-receipts/
├─ scripts/
│  ├─ bootstrap.*
│  ├─ doctor.*
│  ├─ check-release-ready.*
│  └─ smoke-demo.*
├─ tests/
│  ├─ smoke/
│  ├─ fixtures/
│  └─ snapshots/
├─ assets/
│  ├─ logo/
│  └─ cover/
├─ .env.example
├─ .gitignore
├─ CHANGELOG.md
├─ CONTRIBUTING.md
├─ LICENSE
├─ README.md
├─ SECURITY.md
└─ THIRD_PARTY_NOTICES.md
```

### 3.2 目录设计原则

- `docs/` 放“解释系统”的材料，不放内部归档洪水
- `src/` 只放公开愿意维护的能力主干
- `examples/` 放可以被复现的最小样例
- `scripts/` 只保留公开可执行的脚本，不保留私有运维脚本
- `tests/` 优先保留 smoke / fixture，不强求把内部 validator 全搬出来
- `assets/` 只放脱敏后图片、封面、图示

### 3.3 为什么不建议直接公开当前工作区结构

当前工作区根目录含有明显不适合公开的杂糅结构，例如：

- 本机/个人环境目录：`.openclaw/`、`.ssh/`、`.ollama/`、`.android/`
- 用户目录污染：`Desktop/`、`Documents/`、`Contacts/`、`3D Objects/`
- 运行期目录：`memory/`、`logs/`、`output/`、`tmp/`、`snapshots/`、`state/`
- 内部证据链目录：`receipts/`、`evidence/`
- 多项目混仓目录：`webclaw-ui/`、`ecommerce-cs-assistant/`、`AI-Video-Toolkit/` 等

这类目录一旦进入公开仓：

- 会泄露内部工作方式与个人环境
- 会稀释 1.0 门面版主线
- 会让外部用户完全看不懂主入口
- 会显著增加后续维护负担

所以，**公开仓必须是“导出仓”，不是“现有母仓直接开源”。**

---

## 4. 哪些目录适合公开

## 4.1 可以直接纳入公开仓的目录/文件类型

### A 类：建议直接公开

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `.github/` 下的 issue / PR / workflow 基础设施
- `docs/` 下经过筛选的主说明文档
- `src/` 下与 1.0 门面版直接相关的核心代码
- `examples/` 下的最小配置、最小输出、最小演示样例
- `tests/smoke/` 下的基础 smoke 测试
- `assets/logo/`、`assets/cover/` 中明确允许公开的图像资产
- `.env.example`
- `CHANGELOG.md`

### B 类：可公开，但必须先裁剪

- `scripts/`：仅保留公开用户可执行的 bootstrap / doctor / smoke / release-check 脚本
- `config/`：若保留，只能保留 schema、defaults、example，不保留真实值
- `runtime/`：若保留，只能保留样例 runtime contract，不保留真实运行态
- `receipts/`：若保留，只能保留 `examples/sample-receipts/` 中的脱敏样例
- `docs/archive/`：只保留极少量历史说明索引，不要把全部 archive 倒进去

### C 类：建议完全不公开

- `memory/`
- `state/`
- `logs/`
- `output/`
- `tmp/`
- `snapshots/`
- `evidence/`
- `.openclaw/`
- `.ssh/`
- `.ollama/`
- `.android/`
- 各类本机用户目录污染
- 真实运维脚本、真实账号接入脚本、真实授权材料
- 历史内部 receipt 全量目录
- 与 1.0 门面版无关的其他项目目录

---

## 5. 哪些目录需要脱敏 / 裁剪 / 忽略

## 5.1 必须脱敏的内容类型

以下内容即使属于“可公开目录”，也必须先脱敏：

- API Key、Token、Cookie、Session、Webhook URL
- 账号标识、用户 ID、群 ID、文档 token、文件 token
- 本机用户名、主机名、绝对路径
- 内网 IP、堡垒机信息、代理配置、网关地址
- 截图中的个人头像、聊天记录、邮箱、二维码、联系人信息
- 含真实业务时间线的内部证据
- 内部审批流、内控字段、真实审计线索

## 5.2 必须裁剪的目录类型

以下目录建议只做“公开等价物”，不要直接复制：

### `docs/`

保留：

- 架构总览
- 公开边界
- 快速开始
- demo 说明
- roadmap
- FAQ

裁掉：

- 大量 dated archive execution 文档
- 仅内部治理用途文档
- 仅内部 validator / freeze / receipt 追踪文档
- 过度细节化的历史收口记录

### `scripts/`

保留：

- 安装脚本
- 本地检查脚本
- smoke 演示脚本
- release precheck 脚本

裁掉：

- 依赖私有环境变量的脚本
- 依赖私有目录结构的脚本
- 依赖真实服务/真实账号的脚本
- 内部回执生成链和内部运营脚本

### `runtime/` / `receipts/`

保留：

- 结构样例
- demo 样例
- 最小 contract

裁掉：

- 真正运行历史
- 生产环境状态
- 人工确认记录
- 外部确认记录
- 精确时间戳链路
- 任何可逆推出内部流程的证据集

## 5.3 必须忽略的内容类型

建议在公开导出时直接忽略：

- 所有缓存目录
- 所有临时文件
- 所有历史截图和原始录屏
- 所有数据库/本地状态文件
- 所有自动生成但不需要提交的构建产物
- 所有个人工作台残留目录

---

## 6. 建议的根级文档与治理文件

## 6.1 LICENSE 建议

### 首选：`Apache-2.0`

理由：

- 对工程项目更稳妥
- 含明确专利授权条款
- 对后续社区协作比 MIT 更完整
- 适合“公开门面版 + 后续继续演进”的路线

### 次选：`MIT`

适用条件：

- 只想保持最简许可
- 不太关注专利条款
- 更看重低门槛传播

### 不建议当前 1.0 优先采用的类型

- `AGPL`：会抬高外部接入心理成本
- 自定义模糊许可证：会让别人不知道能不能用
- 暂不放许可证：几乎等于别人不能安心使用

### 额外建议

如果品牌名、Logo、产品名不想被自由复用，建议增加：

- `TRADEMARK.md`

明确：

- 代码可按开源许可证使用
- 商标、品牌、Logo 不自动授权

## 6.2 CONTRIBUTING 建议

建议至少包含：

- 提交 issue 前先看 `README`、`FAQ`、`Known Limitations`
- PR 范围要求：小步、可验证、不要顺手改 unrelated
- 分支命名规范
- commit message 建议
- 本地运行与测试最小流程
- 文档变更是否必须同步更新截图 / gif / demo 脚本
- 安全问题不要公开提 issue，改走 `SECURITY.md`

## 6.3 ISSUE_TEMPLATE 建议

建议至少有：

- `bug_report.yml`
  - 复现步骤
  - 实际结果
  - 预期结果
  - 环境信息
  - 附图/日志
- `feature_request.yml`
  - 使用场景
  - 目标收益
  - 非目标
  - 建议方案
- `question.yml`
  - 咨询前已阅读哪些文档
  - 当前卡点是什么

另建议增加：

- `.github/ISSUE_TEMPLATE/config.yml`
  - 开启 discussions 链接
  - 引导安全问题走私密通道

## 6.4 其他建议补齐文件

建议公开仓根目录补齐：

- `README.md`
- `CHANGELOG.md`
- `SECURITY.md`
- `CODEOWNERS`
- `.github/pull_request_template.md`
- `THIRD_PARTY_NOTICES.md`

---

## 7. `.gitignore` 建议项

建议至少覆盖以下内容：

```gitignore
# dependencies
node_modules/
pnpm-lock.yaml.backup

# build outputs
dist/
build/
coverage/
.cache/

# env
.env
.env.*
!.env.example
!.env.*.example

# logs
*.log
logs/

# temp
tmp/
temp/
out/
output/

# state / runtime / receipts (real)
state/
runtime/*.local.json
receipts/
evidence/

# snapshots
snapshots/

# OS / editor
.DS_Store
Thumbs.db
.vscode/
.idea/

# local machine contamination
.openclaw/
.ollama/
.android/
.ssh/
Desktop/
Documents/
Contacts/
3D Objects/

# secrets / credentials
*.pem
*.key
*.p12
*.crt
secrets/
private/
```
```

补充建议：

- 如果 `examples/` 里需要保留样例 receipt，放到 `examples/sample-receipts/`
- 不要在根级保留真实 `receipts/`
- `runtime/` 若既有 example 又有 local state，应该拆分为：
  - `examples/sample-runtime/`
  - 本地真实运行态不入库

---

## 8. 建议的公开边界分层

建议把公开内容分为 3 层：

### 第 1 层：必须公开的门面层

- README
- 快速开始
- 架构总览
- 最小 demo
- 一套能跑通的最小配置示例

### 第 2 层：可以公开的样例层

- 精选后的示例 runtime / sample output / sample receipt
- 限量 smoke test
- 演示脚本
- 文档图示

### 第 3 层：继续留在内部的母仓层

- 内部 history / archive
- 内部 validator 网络
- 内部 receipt / evidence 全链路
- 私有 adapter
- 本机环境耦合能力
- 与其他项目共享但不宜公开的资产

这一层分法的本质是：

> GitHub 上公开的是“可对外理解和协作的外立面”，不是“内部所有房间都打开”。

---

## 9. 发布策略建议

## 9.1 最稳妥的发布方式

建议采用 **导出式发布**：

1. 在内部工作区之外新建一个空目录，例如 `export/tianyan-1.0/`
2. 从内部仓库手工挑选公开资产复制过去
3. 统一执行脱敏
4. 跑一轮 release precheck
5. 初始化为全新 Git 历史后再推 GitHub

不建议：

- 直接在现有母仓上删删减减后 push
- 带着复杂历史提交直接公开
- 先公开再慢慢删敏感内容

## 9.2 关于 Git 历史

如果当前内部仓曾包含敏感信息，即使后面删掉文件，也不代表历史里不存在。

因此推荐：

- **公开仓使用全新初始化历史**

只有在明确确认历史干净时，才考虑做 history filter。

---

## 10. 最小可交付公开包建议

如果时间紧，天衍 1.0 最小公开包建议收敛为：

- `README.md`
- `LICENSE`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `docs/architecture-overview.md`
- `docs/scope-boundary.md`
- `docs/quickstart.md`
- `docs/demo/demo-script.md`
- `docs/demo/screenshots/` 至少 3 张图
- `src/` 中最小主干代码
- `examples/minimal-config/`
- `examples/sample-output/`
- `scripts/check-release-ready.*`
- `tests/smoke/` 中 1~3 个最关键 smoke

只要这套包是干净、可读、可跑、可演示的，就已经足够支撑 1.0 门面版首次上 GitHub。

---

## 11. 建议的最终判断标准

满足以下条件，才算适合公开：

- 外部开发者在 10 分钟内能看懂这个仓库是干什么的
- 外部开发者在 30 分钟内能跑起最小示例
- 仓库首页不会把人带进内部历史迷宫
- 仓库中不存在真实凭据、真实状态、真实证据
- 仓库内容只围绕“天衍 1.0 门面版”本身

如果这 5 条有任意 1 条不满足，就不建议直接发 GitHub。

---

## 12. 本文的明确立场

我不建议把当前内部工作区原样公开。

我建议的是：

- 做一个 **干净、轻量、可维护、可解释** 的 `tianyan-1.0` 公开导出仓
- 公开 **门面层、最小主干、最小 demo、最小样例**
- 把内部母仓继续保留在私有环境中演化

这才是对天衍 1.0 最稳的 GitHub 首发结构。
