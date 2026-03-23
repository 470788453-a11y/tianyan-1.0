function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

function inferDeliverables(goal) {
  const text = String(goal || '').toLowerCase();
  const deliverables = [];
  if (/(架构|architecture)/.test(text)) deliverables.push('architecture-outline');
  if (/(开发|实现|build|implement)/.test(text)) deliverables.push('implementation-plan');
  if (/(接口|api)/.test(text)) deliverables.push('api-contract');
  if (/(测试|test)/.test(text)) deliverables.push('test-strategy');
  if (/(文档|doc|readme)/.test(text)) deliverables.push('documentation');
  return deliverables.length ? [...new Set(deliverables)] : ['task-summary'];
}

function inferComplexity(goal) {
  const tokens = tokenize(goal);
  if (tokens.length >= 18) return 'high';
  if (tokens.length >= 8) return 'medium';
  return 'low';
}

export class ProcessorService {
  analyze(task) {
    const goal = task.goal || '';
    const complexity = inferComplexity(goal);
    const depth = Number(task.depth || task.context?.depth || 0);
    const deliverables = inferDeliverables(goal);
    const shouldSplitByIntent = /(系统|platform|orchestrator|workflow|multi-agent|多智能体)/i.test(goal);
    const should_split = depth < 1 && (complexity === 'high' || deliverables.length >= 3 || shouldSplitByIntent);

    return {
      normalized_goal: goal.trim(),
      keywords: [...new Set(tokenize(goal))].slice(0, 12),
      deliverables,
      complexity,
      should_split: should_split,
      split_reason: should_split ? 'complexity-or-deliverables' : 'not-needed',
      depth,
    };
  }
}
