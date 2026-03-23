import { createEvent, createEvidence } from '../core/task-factory.js';
import { EVENT_TYPES } from '../domain/task.js';

function normalizeInput(input) {
  if (typeof input === 'string') return input.trim();
  if (typeof input?.text === 'string') return input.text.trim();
  return JSON.stringify(input);
}

function inferRisk(text) {
  const value = text.toLowerCase();
  if (/(delete|remove|deploy|publish|restart|shutdown|message|email|send|迁移|部署|删除|发送|发布)/.test(value)) return 'high';
  if (/(write|edit|update|patch|修改|更新)/.test(value)) return 'medium';
  return 'low';
}

function inferMode(text, context) {
  if (context.mode) return context.mode;
  const value = text.toLowerCase();
  if (/(status|summary|summarize|list|看看|状态|总结|列出)/.test(value)) return 'reflex';
  return 'deliberate';
}

function extractConstraints(text, context) {
  const constraints = [...(Array.isArray(context.constraints) ? context.constraints : [])];
  for (const line of text.split(/\r?\n/)) {
    if (/^(不要|必须|只要|仅|禁止)/.test(line.trim())) {
      constraints.push(line.trim());
    }
  }
  return [...new Set(constraints)];
}

export class InterpreterAgent {
  name = 'interpreter';

  async run(ctx) {
    const text = normalizeInput(ctx.task_card.input);
    const goal = text;
    const risk_level = inferRisk(text);
    const mode = inferMode(text, ctx.task_card.context || {});
    const constraints = extractConstraints(text, ctx.task_card.context || {});

    return {
      task_patch: {
        goal,
        risk_level,
        mode,
        constraints,
        status: 'understood',
      },
      evidence: [createEvidence('log', { goal, risk_level, mode, constraints })],
      events: [createEvent(ctx.task_card.task_id, EVENT_TYPES.INTENT_RESOLVED, this.name, { goal, risk_level, mode })],
      next_action: mode === 'reflex' ? 'route_reflex' : 'plan',
    };
  }
}
