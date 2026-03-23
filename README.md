# 天衍 1.0 / Tianyan 1.0

> 一个面向真实任务推进的开源 AI 运行框架起点版本。  
> An open-source AI runtime framework focused on task execution, traceability, and delivery closure.

[![Release](https://img.shields.io/github/v/release/470788453-a11y/tianyan-1.0)](https://github.com/470788453-a11y/tianyan-1.0/releases/tag/v1.0.0)
[![License](https://img.shields.io/github/license/470788453-a11y/tianyan-1.0)](./LICENSE)
[![Stars](https://img.shields.io/github/stars/470788453-a11y/tianyan-1.0?style=social)](https://github.com/470788453-a11y/tianyan-1.0)

## 为什么做这个项目

很多 AI 项目擅长“生成一个回答”，但不一定擅长把一个任务**稳定地推进到结束**。

**天衍 1.0** 想解决的是另一类问题：

- 任务怎么定义
- 执行过程怎么拆分
- 关键动作怎么留痕
- 人和系统怎么协同确认
- 一个结果怎么被判断为“真的完成了”

所以这个项目更关注：**任务推进、过程留痕、结果收口**，而不只是单轮对话生成。

如果你正在寻找一个更偏**执行与交付**的 AI 运行框架起点，而不是单纯聊天壳或概念 Demo，这个仓库适合作为一个起点来看。

---

## 这个仓库能看到什么

当前公开版本已经包含一套可理解的最小骨架：

- Meta Core
- TaskCard 协议
- 统一状态机
- Event Bus 事件总线
- Orchestrator
- Interpreter / Planner / Decider / Reflex Matcher / Verifier / Responder / Reflector
- Memory / Guardrail / Processor / Router / Executor / Tool Registry
- Tool Adapter 抽象层
- Background Worker
- Subtask dependency queue + wave runner
- Timeline / Graph / Queue builders
- HTTP API + 简易 Web UI
- JSON 文件持久化

更完整的结构说明见：
- [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- [`docs/agentx-1.0-plan.md`](./docs/agentx-1.0-plan.md)

---

## 这个项目适合谁

- 想把 AI 从“会聊天”推进到“会做事”的开发者
- 想研究任务流、执行链路、结果收口机制的人
- 想搭一套可扩展 AI 运行骨架的个人或小团队
- 想做自己的 agent runtime，而不是只接一个模型壳的人

---

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/470788453-a11y/tianyan-1.0.git
cd tianyan-1.0
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动项目

```bash
npm start
```

### 4. 本地访问

```text
http://localhost:4317
```

---

## API 概览

当前仓库已提供一组基础 HTTP API，例如：

- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `GET /api/tasks/:taskId/events`
- `GET /api/tasks/:taskId/timeline`
- `GET /api/tasks/:taskId/graph`
- `GET /api/tasks/:taskId/queue`
- `GET /api/tasks/:taskId/files`
- `GET /api/background/runs`
- `POST /api/background/run`

---

## 运行主链路

```text
input -> interpreter -> memory -> processor -> planner -> decider -> guardrail -> executor -> subtask-queue -> verifier -> responder -> reflector -> close
```

---

## 风险闸门

高风险动作默认进入 `escalated`，例如：

- deploy
- delete / remove
- send / publish / message / email
- restart / shutdown / migrate

这意味着项目不把“能生成”直接等同于“能安全交付”。

---

## 仓库结构

```text
.
├─ docs/          # 文档、计划、发布资料
├─ public/        # 前端静态资源
├─ src/           # 核心源码
├─ tests/         # 测试
├─ ARCHITECTURE.md
├─ README.md
├─ package.json
└─ LICENSE
```

另外，`docs/launch-kit/` 中还包含：

- 开源总方案
- README 草稿
- Release Notes 草稿
- 对外发布文案
- 仓库结构蓝图
- 发布前检查清单

---

## 当前版本边界

`v1.0.0` 更像一个**开源起点版本**，当前优先解决的是：

- 项目定位清楚
- 仓库结构可理解
- 基础运行骨架已公开
- 后续版本有明确演进空间

当前**不承诺**：

- 完整商业化能力
- 一键覆盖全部场景
- 托管服务或现成线上环境
- 私有密钥、账号和受限资源

---

## Roadmap

### v1.0
- 完成首个开源版本发布
- 明确项目定位、目录结构与使用方式
- 提供最小可理解的运行骨架

### v1.1
- 补齐安装文档与最小样例
- 增加更明确的配置说明
- 优化项目可读性与新手上手体验

### 后续方向
- 更完整的运行观测
- 更稳定的协作与确认机制
- 更容易复用的模板化能力

---

## Release

当前首个公开版本：

- [`v1.0.0`](https://github.com/470788453-a11y/tianyan-1.0/releases/tag/v1.0.0)

---

## 参与方式

欢迎通过以下方式参与：

- 提 Issue：反馈 bug、文档问题、使用体验
- 提 PR：修文档、补样例、补测试、改结构
- 提讨论：给出更清晰的场景、需求和改进建议

如果准备提交较大改动，建议先开 issue 对齐目标，避免重复工作。

如果你觉得这个方向值得继续做，欢迎点一个 **Star**。

---

## License

MIT
