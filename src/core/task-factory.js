import { makeId, nowIso } from '../utils/id.js';

export function createTaskCard(input, context = {}) {
  const timestamp = nowIso();
  return {
    task_id: makeId('task'),
    parent_task_id: context.parent_task_id || null,
    goal: '',
    input,
    context,
    constraints: Array.isArray(context.constraints) ? context.constraints : [],
    risk_level: 'medium',
    priority: context.priority || 'P1',
    mode: context.mode || 'deliberate',
    owner: context.owner || 'orchestrator',
    status: 'new',
    plan: null,
    result: null,
    evidence: [],
    next_action: null,
    depth: Number(context.depth || 0),
    subtasks: [],
    verification: null,
    reflection: null,
    analysis: null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function patchTask(task, output = {}) {
  if (output.task_patch) {
    Object.assign(task, output.task_patch);
  }
  if (output.evidence?.length) {
    task.evidence.push(...output.evidence);
  }
  if (output.next_action !== undefined) {
    task.next_action = output.next_action;
  }
  task.updated_at = nowIso();
  return task;
}

export function createEvent(taskId, type, source, payload = {}) {
  return {
    event_id: makeId('evt'),
    task_id: taskId,
    type,
    source,
    payload,
    created_at: nowIso(),
  };
}

export function createEvidence(type, content) {
  return {
    id: makeId('evi'),
    type,
    content,
    created_at: nowIso(),
  };
}
