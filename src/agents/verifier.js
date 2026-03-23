import { createEvent, createEvidence } from '../core/task-factory.js';
import { EVENT_TYPES } from '../domain/task.js';

export class VerifierAgent {
  name = 'verifier';

  async run(ctx) {
    const result = ctx.task_card.result || {};
    const evidenceCount = (ctx.task_card.evidence || []).length;
    const artifacts = result.output?.artifacts || [];
    const passed = Boolean(result.success) && evidenceCount >= 1 && artifacts.length >= 1;

    return {
      task_patch: {
        verification: {
          passed,
          evidence_count: evidenceCount,
          artifact_count: artifacts.length,
        },
      },
      evidence: [createEvidence('verification', { passed, evidenceCount, artifacts })],
      events: [createEvent(ctx.task_card.task_id, passed ? EVENT_TYPES.VERIFICATION_PASSED : EVENT_TYPES.VERIFICATION_FAILED, this.name, { passed, evidenceCount, artifactCount: artifacts.length })],
      next_action: passed ? 'respond' : 'retry or inspect result',
    };
  }
}
