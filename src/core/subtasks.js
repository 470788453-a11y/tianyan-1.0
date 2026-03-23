import { createTaskCard } from './task-factory.js';

const deliverablePrompts = {
  'architecture-outline': 'Produce an architecture outline',
  'implementation-plan': 'Produce an implementation plan',
  'api-contract': 'Produce an API contract',
  'test-strategy': 'Produce a test strategy',
  documentation: 'Produce documentation',
  'task-summary': 'Produce a concise task summary',
};

const dependencyRules = {
  'architecture-outline': [],
  'api-contract': ['architecture-outline'],
  'test-strategy': ['architecture-outline'],
  'implementation-plan': ['architecture-outline', 'api-contract', 'test-strategy'],
  documentation: ['architecture-outline', 'api-contract', 'test-strategy', 'implementation-plan'],
  'task-summary': [],
};

export function buildSubtasksFromAnalysis(task, analysis) {
  if (!analysis.should_split) return [];

  const created = analysis.deliverables.map((deliverable, index) => {
    const prompt = deliverablePrompts[deliverable] || `Produce ${deliverable}`;
    const subtask = createTaskCard(`${prompt} for: ${task.goal}`, {
      source: 'subtask-builder',
      mode: 'deliberate',
      priority: task.priority,
      constraints: task.constraints,
      parent_task_id: task.task_id,
      depth: Number(task.depth || 0) + 1,
      owner: 'subtask-runner',
      autoRunSubtasks: false,
    });
    subtask.parent_task_id = task.task_id;
    subtask.goal = `${prompt} for: ${task.goal}`;
    subtask.owner = 'subtask';
    subtask.status = 'new';
    subtask.sequence = index + 1;
    subtask.deliverable = deliverable;
    subtask.dependencies = [];
    return subtask;
  });

  const byDeliverable = new Map(created.map((subtask) => [subtask.deliverable, subtask]));
  for (const subtask of created) {
    const deps = dependencyRules[subtask.deliverable] || [];
    subtask.dependencies = deps
      .map((deliverable) => byDeliverable.get(deliverable)?.task_id)
      .filter(Boolean);
  }

  return created;
}
