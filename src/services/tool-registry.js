function toMarkdown(title, content) {
  const lines = [`# ${title}`, ''];
  for (const [key, value] of Object.entries(content || {})) {
    if (Array.isArray(value)) {
      lines.push(`## ${key}`);
      lines.push(...value.map((item) => `- ${typeof item === 'string' ? item : JSON.stringify(item)}`));
      lines.push('');
    } else if (value && typeof value === 'object') {
      lines.push(`## ${key}`);
      lines.push('```json');
      lines.push(JSON.stringify(value, null, 2));
      lines.push('```');
      lines.push('');
    } else {
      lines.push(`- **${key}**: ${value}`);
    }
  }
  return lines.join('\n');
}

function makeAdapter(name, deliverable, build) {
  return {
    name,
    canHandle(task, analysis) {
      return (analysis.deliverables || []).includes(deliverable) || String(task.goal || '').toLowerCase().includes(deliverable.replace(/-/g, ' '));
    },
    run(task, analysis) {
      const artifact = build(task, analysis);
      return {
        adapter: name,
        deliverable,
        artifact,
        actions: [
          { kind: 'write_artifact', artifact },
          { kind: 'write_text_file', relativePath: `${artifact.type}.md`, content: toMarkdown(artifact.title, artifact.content) },
        ],
      };
    },
  };
}

const architectureAdapter = makeAdapter('architecture-adapter', 'architecture-outline', (task, analysis) => ({
  type: 'architecture-outline',
  title: 'Architecture Outline',
  content: {
    goal: task.goal,
    layers: ['meta-core', 'cognition-loop', 'coordination-hub', 'capability-services', 'execution-layer'],
    complexity: analysis.complexity,
    deliverables: analysis.deliverables,
  },
}));

const apiContractAdapter = makeAdapter('api-contract-adapter', 'api-contract', (task) => ({
  type: 'api-contract',
  title: 'API Contract',
  content: {
    endpoints: [
      'GET /api/health',
      'GET /api/tasks',
      'POST /api/tasks',
      'GET /api/tasks/:taskId',
      'GET /api/tasks/:taskId/events',
      'GET /api/tasks/:taskId/timeline',
      'GET /api/tasks/:taskId/graph',
      'GET /api/tasks/:taskId/queue',
      'GET /api/tasks/:taskId/files',
      'GET /api/tasks/:taskId/file?path=...',
      'POST /api/tasks/:taskId/run-subtasks',
    ],
    note: `Generated for: ${task.goal}`,
  },
}));

const testStrategyAdapter = makeAdapter('test-strategy-adapter', 'test-strategy', (task) => ({
  type: 'test-strategy',
  title: 'Test Strategy',
  content: {
    unit: ['task factory', 'state machine', 'agents', 'graph builder', 'adapter runtime'],
    integration: ['orchestrator lifecycle', 'approval flow', 'subtask execution', 'background consolidation', 'adapter runtime actions'],
    note: `Generated for: ${task.goal}`,
  },
}));

const implementationAdapter = makeAdapter('implementation-plan-adapter', 'implementation-plan', (task, analysis) => ({
  type: 'implementation-plan',
  title: 'Implementation Plan',
  content: {
    modules: analysis.deliverables,
    next_build_steps: ['define contracts', 'implement services', 'wire orchestrator', 'verify outputs'],
    note: `Generated for: ${task.goal}`,
  },
}));

const documentationAdapter = makeAdapter('documentation-adapter', 'documentation', (task, analysis) => ({
  type: 'documentation',
  title: 'Documentation Outline',
  content: {
    sections: ['overview', 'architecture', 'api', 'verification', 'operations'],
    references: analysis.deliverables,
    note: `Generated for: ${task.goal}`,
  },
}));

const runtimeInspectAdapter = {
  name: 'safe-shell-inspect-adapter',
  canHandle() {
    return true;
  },
  run() {
    const artifact = {
      type: 'runtime-inspection',
      title: 'Runtime Inspection',
      content: {
        checks: ['node-version', 'npm-version'],
      },
    };

    return {
      adapter: 'safe-shell-inspect-adapter',
      deliverable: 'runtime-inspection',
      artifact,
      actions: [
        { kind: 'run_command', command: 'node', args: ['-v'] },
        { kind: 'run_command', command: 'npm', args: ['-v'] },
        { kind: 'write_artifact', artifact },
        { kind: 'write_text_file', relativePath: 'runtime-inspection.md', content: toMarkdown(artifact.title, artifact.content) },
      ],
    };
  },
};

const summaryAdapter = {
  name: 'summary-adapter',
  canHandle() {
    return true;
  },
  run(task, analysis) {
    const artifact = {
      type: 'task-summary',
      title: 'Task Summary',
      content: {
        goal: task.goal,
        complexity: analysis.complexity,
        keywords: analysis.keywords,
      },
    };

    return {
      adapter: 'summary-adapter',
      deliverable: 'task-summary',
      artifact,
      actions: [
        { kind: 'write_artifact', artifact },
        { kind: 'write_text_file', relativePath: 'task-summary.md', content: toMarkdown(artifact.title, artifact.content) },
      ],
    };
  },
};

const docBundleExportAdapter = {
  name: 'doc-bundle-export-adapter',
  canHandle() {
    return true;
  },
  run(task) {
    const artifact = {
      type: 'doc-bundle-export',
      title: 'Doc Bundle Export',
      content: {
        goal: task.goal,
        outputs: ['bundle/bundle.md', 'bundle/manifest.json', 'bundle/bundle.zip'],
      },
    };

    return {
      adapter: 'doc-bundle-export-adapter',
      deliverable: 'doc-bundle-export',
      artifact,
      actions: [
        { kind: 'bundle_task_outputs' },
        { kind: 'write_artifact', artifact },
      ],
    };
  },
};

export class ToolRegistry {
  constructor() {
    this.adapters = [
      architectureAdapter,
      apiContractAdapter,
      testStrategyAdapter,
      implementationAdapter,
      documentationAdapter,
      runtimeInspectAdapter,
      summaryAdapter,
      docBundleExportAdapter,
    ];
  }

  select(task, analysis) {
    const picks = this.adapters.filter((adapter) => adapter.canHandle(task, analysis));
    return picks.length ? picks : [summaryAdapter, runtimeInspectAdapter, docBundleExportAdapter];
  }
}
