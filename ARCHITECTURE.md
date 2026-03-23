# 天衍 1.0 / Architecture Notes

## 当前实现边界

这是一个独立的 Phase 4 项目；当前开发计划正式命名为 **天衍 1.0**。

它不依赖 ClawCloud，也不和现有爪云页面耦合。

> 命名约定：对外计划名使用“天衍 1.0”，内部目录 / 技术 slug 仍暂保留 `agentx-1.0`。

---

## 已实现核心

- Meta Core
- TaskCard
- State Machine
- Event Bus
- Orchestrator
- Interpreter / Planner / Decider / Reflex Matcher / Verifier / Responder / Reflector
- Memory / Guardrail / Processor / Router / Executor / Tool Registry
- Tool Adapter 抽象层
- Background Worker
- Subtask dependency queue + wave runner
- Timeline / Graph / Queue builders
- HTTP API + 简易 Web UI
- JSON 文件持久化

---

## 运行主链路

```text
input -> interpreter -> memory -> processor -> planner -> decider -> guardrail -> executor -> subtask-queue -> verifier -> responder -> reflector -> close
```

---

## 风险闸门

高风险动作默认进入 `escalated`：

- deploy
- delete / remove
- send / publish / message / email
- restart / shutdown / migrate

---

## Tool Adapter Layer

当前以 adapter 方式输出 artifacts：

- architecture-outline
- implementation-plan
- api-contract
- test-strategy
- documentation
- task-summary

---

## Subtask Queue

当前子任务已从“按生成顺序跑”升级为“按依赖波次执行”：

- architecture-outline
- api-contract / test-strategy 依赖 architecture-outline
- implementation-plan 依赖 architecture-outline + api-contract + test-strategy
- documentation 依赖 architecture-outline + api-contract + test-strategy + implementation-plan

---

## Timeline / Graph / Queue

新增三类派生视图：

- timeline：按时间排序 task + events
- graph：root task / subtasks / parent-child / depends-on
- queue：wave 级 ready / blocked 计划

---

## 后续扩展建议

### Phase 5
- adapter runtime contract
- 真正外部 tool adapter
- IO / Processor / Cleaner 插件层
- Federation / delegation
- graph 交互与节点详情
- 多节点 memory boundary
- ClawCloud 嵌入式工作台

当前已落下第一步：
- 受控命令执行（node / npm 版本探测）
- artifact 落盘
- markdown / text 导出

详细开发路线见：`docs/agentx-1.0-plan.md`
