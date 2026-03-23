# 天衍 1.0 开发计划

## 定位

**天衍 1.0** 是“人体智能协作模式开发计划”的正式名称。

当前实现策略：
- **对外名称**：天衍 1.0
- **内部技术 slug**：`agentx-1.0`
- **目标**：先把这套协作模式做成一个可运行、可验证、可扩展的独立系统，再决定如何并入 ClawCloud

---

## 当前已完成

### Phase 1
- TaskCard
- State Machine
- Event Bus
- 基础 Orchestrator
- 基础 HTTP API

### Phase 2
- Verifier
- Processor
- Tool Registry
- Background Worker
- Subtask skeleton

### Phase 3
- Tool Adapter 抽象
- Subtask Runner
- Timeline / Graph 视图

### Phase 4
- Dependency-based Subtask Queue
- Queue API
- Timeline / Graph / Queue 可视化面板
- 术语开始向“天衍 1.0”统一

---

## 当前架构主链路

```text
input -> interpreter -> memory -> processor -> planner -> decider -> guardrail -> executor -> subtask-queue -> verifier -> responder -> reflector -> close
```

---

## Phase 5（下一阶段）

### P1：真实外部执行层
- 把当前 adapter 从“生成 artifacts”升级为“可执行外部动作”
- 建立 adapter runtime contract
- 增加执行结果标准化结构：`stdout / stderr / exitCode / artifacts / risk`
- 已完成第一批动作：`write_artifact / write_text_file / run_command(node,npm)`
- 已完成 generated files 可见性：任务可查看实际导出文件列表

### P2：插件层
- IO plugin
- Processor plugin
- Cleaner plugin
- Executor adapter plugin

### P3：协作层
- Federation / delegation manager
- 子任务派发策略
- 更明确的人类审批节点

### P4：前端增强
- graph 交互
- 节点详情抽屉
- queue 波次高亮
- timeline 筛选

---

## 命名规则

### 对外
- 天衍 1.0
- 天衍 1.0 开发计划
- 天衍 1.0 控制台

### 内部暂保留
- `agentx-1.0`
- `task_* / evt_* / mem_*` 等现有 id 体系

---

## 当前建议

下一步优先做：**真实外部 tool adapters**。

原因：现在系统已经有任务卡、状态机、验证器、依赖队列和可视化；最缺的是“真正做事”的外部执行层。
