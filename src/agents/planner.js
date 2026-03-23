import { createEvent, createEvidence } from '../core/task-factory.js';
import { EVENT_TYPES } from '../domain/task.js';

function makeSteps(goal, mode, analysis = {}) {
  const base = [
    { step_id: 's1', title: 'Understand goal', description: goal, status: 'done' },
    { step_id: 's2', title: 'Check memory and constraints', status: 'done' },
    { step_id: 's3', title: 'Analyze deliverables and complexity', status: 'done' },
  ];

  if (analysis.should_split) {
    base.push({ step_id: 's4', title: 'Create subtasks for major deliverables', status: 'pending' });
  }

  if (mode === 'reflex') {
    return [...base, { step_id: 's5', title: 'Respond with minimal safe action', status: 'pending' }];
  }

  return [
    ...base,
    { step_id: 's6', title: 'Execute selected tools/plugins', status: 'pending' },
    { step_id: 's7', title: 'Verify result before reply', status: 'pending' },
  ];
}

export class PlannerAgent {
  name = 'planner';

  async run(ctx) {
    const analysis = ctx.task_card.analysis || {};
    const steps = makeSteps(ctx.task_card.goal, ctx.task_card.mode, analysis);
    const plan = {
      summary: ctx.task_card.mode === 'reflex' ? 'Fast path plan' : 'Deliberate plan',
      steps,
      deliverables: analysis.deliverables || [],
      complexity: analysis.complexity || 'unknown',
    };

    return {
      task_patch: {
        plan,
        status: 'planned',
      },
      evidence: [createEvidence('log', plan)],
      events: [createEvent(ctx.task_card.task_id, EVENT_TYPES.PLAN_GENERATED, this.name, { stepCount: steps.length, deliverableCount: (analysis.deliverables || []).length })],
      next_action: 'decide',
    };
  }
}
