import { createEvent, createEvidence } from '../core/task-factory.js';
import { EVENT_TYPES } from '../domain/task.js';

export class ReflectorAgent {
  name = 'reflector';

  async run(ctx) {
    const success = Boolean(ctx.task_card.result?.success);
    const reflection = {
      success,
      lessons: success
        ? ['Explicit state transitions reduce ambiguity.', 'Verification before close keeps task quality stable.']
        : ['Failed tasks must preserve next_action for recovery.'],
      reusable_patterns: [ctx.task_card.mode === 'reflex' ? 'fast-lane' : 'deliberate-lane'],
      next_improvements: success
        ? ['Expand tool plugins.', 'Add background learner worker.']
        : ['Improve plan validation before execution.'],
    };

    return {
      evidence: [createEvidence('reflection', reflection)],
      events: [createEvent(ctx.task_card.task_id, EVENT_TYPES.LEARNING_EXTRACTED, this.name, { success })],
      next_action: success ? 'close task' : 'retry or inspect',
      task_patch: {
        reflection,
      },
    };
  }
}
