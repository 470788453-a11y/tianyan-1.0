import { makeId, nowIso } from '../utils/id.js';

export class BackgroundWorker {
  constructor({ taskStore, memoryService, backgroundRunStore }) {
    this.taskStore = taskStore;
    this.memoryService = memoryService;
    this.backgroundRunStore = backgroundRunStore;
  }

  runConsolidation() {
    const tasks = this.taskStore.list().filter((task) => task.status === 'closed' && task.reflection);
    const learned = [];

    for (const task of tasks.slice(0, 10)) {
      const record = this.memoryService.learn(task, {
        learned_from: task.task_id,
        reflection: task.reflection,
        verification: task.verification || null,
      });
      learned.push({ task_id: task.task_id, memory_id: record.memory_id });
    }

    return this.backgroundRunStore.save({
      run_id: makeId('bg'),
      type: 'consolidation',
      learned_count: learned.length,
      learned,
      created_at: nowIso(),
    });
  }
}
