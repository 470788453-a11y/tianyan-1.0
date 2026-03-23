import { config } from '../config.js';
import { EVENT_TYPES } from '../domain/task.js';
import { buildSubtaskExecutionPlan } from './subtask-queue.js';
import { buildSubtasksFromAnalysis } from './subtasks.js';
import { transitionTask } from './state-machine.js';
import { createEvent, createEvidence, createTaskCard, patchTask } from './task-factory.js';

export class Orchestrator {
  constructor({
    metaCore,
    taskStore,
    eventBus,
    memoryService,
    guardrailService,
    routerService,
    executorService,
    processorService,
    toolRegistry,
    interpreter,
    planner,
    decider,
    responder,
    reflector,
    verifier,
    reflexMatcher,
  }) {
    Object.assign(this, {
      metaCore,
      taskStore,
      eventBus,
      memoryService,
      guardrailService,
      routerService,
      executorService,
      processorService,
      toolRegistry,
      interpreter,
      planner,
      decider,
      responder,
      reflector,
      verifier,
      reflexMatcher,
    });
  }

  async createAndRun(input, context = {}) {
    const task = createTaskCard(input, context);
    this.taskStore.save(task);
    await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.INPUT_RECEIVED, 'system', { input }));
    return this.run(task.task_id);
  }

  async run(taskId) {
    const task = this.taskStore.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    if (task.status === 'new') {
      await this.applyAgent(task, this.interpreter);
    }

    const memoryHit = this.memoryService.search(task.goal || JSON.stringify(task.input));
    if (memoryHit.records.length) {
      task.evidence.push(memoryHit.evidence);
    }
    await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.MEMORY_HIT, 'memory', { count: memoryHit.records.length }));

    task.analysis = this.processorService.analyze(task);
    task.evidence.push(createEvidence('analysis', task.analysis));
    this.taskStore.save(task);

    if (task.mode === 'reflex') {
      const reflex = this.reflexMatcher.match(task);
      task.evidence.push(createEvidence('log', { reflex }));
      if (task.status === 'understood') {
        task.plan = {
          summary: 'Reflex plan',
          steps: [{ step_id: 'r1', title: 'Immediate safe response', status: 'pending' }],
          deliverables: task.analysis.deliverables,
          complexity: task.analysis.complexity,
        };
        transitionTask(task, 'approved');
        this.taskStore.save(task);
      }
    } else {
      if (task.status === 'understood') {
        await this.applyAgent(task, this.planner);
      }
      if (task.status === 'planned' || task.status === 'understood') {
        await this.applyAgent(task, this.decider);
      }
    }

    const guard = this.guardrailService.check(task);
    if (!guard.allowed) {
      if (task.status !== 'escalated') {
        transitionTask(task, guard.requiresApproval ? 'escalated' : 'blocked');
      }
      task.next_action = guard.reason;
      task.evidence.push(createEvidence('guardrail', guard));
      await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.RISK_FLAGGED, 'guardrail', guard));
      this.taskStore.save(task);
      return task;
    }

    if (task.status === 'approved' || task.status === 'retrying' || task.status === 'executing') {
      if (task.status === 'approved' || task.status === 'retrying') {
        transitionTask(task, 'executing');
      }
      this.taskStore.save(task);

      const routes = this.routerService.route(task);
      await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.TASK_ROUTED, 'router', { routes }));

      if (!Array.isArray(task.subtasks) || !task.subtasks.length) {
        const subtasks = buildSubtasksFromAnalysis(task, task.analysis);
        for (const subtask of subtasks) {
          this.taskStore.save(subtask);
          await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.AGENT_SPAWNED, 'subtask-builder', {
            subtask_id: subtask.task_id,
            deliverable: subtask.deliverable,
            dependencies: subtask.dependencies,
          }));
        }
        task.subtasks = subtasks.map((item) => item.task_id);
      }

      task.subtask_queue = buildSubtaskExecutionPlan(task, this.taskStore.list());
      this.taskStore.save(task);

      const adapters = this.toolRegistry.select(task, task.analysis);
      await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.TOOL_CALLED, 'executor', { adapters: adapters.map((tool) => tool.name) }));
      const execution = await this.executorService.execute(task, { analysis: task.analysis, tools: adapters });
      task.result = {
        summary: 'Execution completed successfully.',
        output: execution.output,
        success: execution.success,
      };
      if (execution.plan) task.plan = execution.plan;
      if (execution.evidence?.length) task.evidence.push(...execution.evidence);
      await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.TOOL_FINISHED, 'executor', execution.output));

      const shouldAutoRunSubtasks =
        config.autoRunSubtasks &&
        task.analysis?.should_split &&
        task.depth < config.maxSubtaskDepth &&
        task.context?.autoRunSubtasks !== false;

      if (shouldAutoRunSubtasks && task.subtasks?.length) {
        const subtaskResults = await this.runSubtasks(task.task_id);
        task.result.output.subtask_results = subtaskResults;
        task.subtask_queue = buildSubtaskExecutionPlan(task, this.taskStore.list());
      }

      transitionTask(task, execution.success ? 'verifying' : 'failed');
      this.taskStore.save(task);
    }

    if (task.status === 'verifying') {
      await this.applyAgent(task, this.verifier);
      if (!task.verification?.passed) {
        transitionTask(task, 'failed');
        task.next_action = 'inspect verification failure or retry';
        this.taskStore.save(task);
        return task;
      }

      await this.applyAgent(task, this.responder);
      await this.applyAgent(task, this.reflector);
      if (this.metaCore.policy.requireVerificationBeforeDone) {
        transitionTask(task, 'closed');
        await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.TASK_CLOSED, 'system', {}));
      }
      this.memoryService.learn(task, task.reflection || {});
      this.taskStore.save(task);
    }

    return task;
  }

  async runSubtasks(taskId) {
    const task = this.taskStore.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);

    const childTasks = this.taskStore
      .list()
      .filter((item) => item.parent_task_id === task.task_id)
      .sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

    const plan = buildSubtaskExecutionPlan(task, this.taskStore.list());
    const results = [];

    if (plan.status === 'blocked') {
      task.subtask_queue = plan;
      this.taskStore.save(task);
      return results;
    }

    for (const wave of plan.waves) {
      for (const readyTask of wave.ready) {
        const child = childTasks.find((item) => item.task_id === readyTask.task_id);
        if (!child) continue;
        const ran = await this.run(child.task_id);
        results.push({
          task_id: ran.task_id,
          goal: ran.goal,
          status: ran.status,
          deliverable: ran.deliverable || null,
          artifacts: ran.result?.output?.artifacts || [],
          dependencies: ran.dependencies || [],
          wave: wave.index,
        });
        await this.eventBus.publish(createEvent(task.task_id, EVENT_TYPES.AGENT_COMPLETED, 'subtask-runner', {
          subtask_id: ran.task_id,
          status: ran.status,
          wave: wave.index,
        }));
      }
    }

    task.subtask_queue = buildSubtaskExecutionPlan(task, this.taskStore.list());
    this.taskStore.save(task);
    return results;
  }

  async approve(taskId) {
    const task = this.taskStore.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    task.context = { ...(task.context || {}), approved: true };
    if (task.status === 'escalated' || task.status === 'blocked') {
      transitionTask(task, 'approved');
    }
    this.taskStore.save(task);
    return this.run(taskId);
  }

  async retry(taskId) {
    const task = this.taskStore.get(taskId);
    if (!task) throw new Error(`Task not found: ${taskId}`);
    if (task.status === 'failed' || task.status === 'blocked' || task.status === 'escalated') {
      transitionTask(task, 'retrying');
      this.taskStore.save(task);
    }
    return this.run(taskId);
  }

  async applyAgent(task, agent) {
    const output = await agent.run({
      task_card: task,
      context_slice: task.context,
      memory_slice: [],
      policy_slice: this.metaCore.policy,
    });
    patchTask(task, output);
    if (output.events?.length) {
      for (const event of output.events) {
        await this.eventBus.publish(event);
      }
    }
    this.taskStore.save(task);
    return task;
  }
}
