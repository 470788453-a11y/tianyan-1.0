import { createEvent, createEvidence } from '../core/task-factory.js';
import { EVENT_TYPES } from '../domain/task.js';

export class ResponderAgent {
  name = 'responder';

  async run(ctx) {
    const result = ctx.task_card.result || { summary: 'No result', output: null, success: false };
    const text = [
      `Goal: ${ctx.task_card.goal}`,
      `Status: ${result.success ? 'done' : 'failed'}`,
      `Mode: ${ctx.task_card.mode}`,
      `Artifacts: ${(result.output?.artifacts || []).join(', ') || 'none'}`,
      result.summary ? `Summary: ${result.summary}` : null,
    ].filter(Boolean).join('\n');

    return {
      task_patch: {
        result: {
          ...result,
          summary: result.summary || text,
          user_response: text,
        },
        status: 'responding',
      },
      evidence: [createEvidence('log', { user_response: text })],
      events: [createEvent(ctx.task_card.task_id, EVENT_TYPES.RESPONSE_READY, this.name, {})],
    };
  }
}
