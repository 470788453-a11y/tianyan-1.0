import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { config } from '../src/config.js';
import { createApp } from '../src/app.js';
import { buildSubtaskExecutionPlan } from '../src/core/subtask-queue.js';
import { buildTaskGraph, buildTaskTimeline } from '../src/core/task-graph.js';

function resetDataDir() {
  fs.mkdirSync(config.dataDir, { recursive: true });
  for (const file of ['tasks.json', 'events.json', 'memory.json', 'background-runs.json']) {
    const full = path.join(config.dataDir, file);
    if (fs.existsSync(full)) fs.unlinkSync(full);
  }
  const generatedDir = path.join(config.dataDir, 'generated');
  if (fs.existsSync(generatedDir)) fs.rmSync(generatedDir, { recursive: true, force: true });
}

test('low-risk deliberate task closes successfully with verification and subtasks', async () => {
  resetDataDir();
  const app = createApp();
  const task = await app.orchestrator.createAndRun('设计一个多智能体任务流转系统，并输出架构、接口、测试方案和实现计划', { source: 'test' });
  assert.equal(task.status, 'closed');
  assert.equal(task.result.success, true);
  assert.equal(task.verification.passed, true);
  assert.ok(task.evidence.length > 0);
  assert.ok((task.subtasks || []).length >= 3);
  assert.ok((task.result.output.subtask_results || []).length >= 3);
  assert.ok(task.subtask_queue?.waves?.length >= 2);
});

test('executor runtime writes json and markdown exports and bundle', async () => {
  resetDataDir();
  const app = createApp();
  const task = await app.orchestrator.createAndRun('输出架构、接口、测试、实现计划、文档', { source: 'test' });
  const actionResults = task.result.output.action_results || [];
  assert.ok(actionResults.some((item) => item.kind === 'write_artifact' && item.success));
  assert.ok(actionResults.some((item) => item.kind === 'write_text_file' && item.success));
  assert.ok(actionResults.some((item) => item.kind === 'run_command' && item.command === 'node' && item.success));
  const bundleAction = actionResults.find((item) => item.kind === 'bundle_task_outputs' && item.success);
  assert.ok(bundleAction);
  assert.ok(bundleAction.bundleZipPath);
  assert.ok(task.result.output.runtime_summary.total_actions >= 1);
  const generatedJson = path.join(config.generatedDir, task.task_id, 'task-summary.json');
  const generatedMd = path.join(config.generatedDir, task.task_id, 'task-summary.md');
  const packageReadme = path.join(config.generatedDir, task.task_id, 'README.md');
  const packageIndex = path.join(config.generatedDir, task.task_id, 'index.json');
  const bundleMd = path.join(config.generatedDir, task.task_id, 'bundle', 'bundle.md');
  const manifestJson = path.join(config.generatedDir, task.task_id, 'bundle', 'manifest.json');
  const bundleZip = path.join(config.generatedDir, task.task_id, 'bundle', 'bundle.zip');
  assert.ok(fs.existsSync(generatedJson));
  assert.ok(fs.existsSync(generatedMd));
  assert.ok(fs.existsSync(packageReadme));
  assert.ok(fs.existsSync(packageIndex));
  assert.ok(fs.existsSync(bundleMd));
  assert.ok(fs.existsSync(manifestJson));
  assert.ok(fs.existsSync(bundleZip));
  const bundleContent = fs.readFileSync(bundleMd, 'utf8');
  assert.match(bundleContent, /天衍1.0 Export Bundle/);
  assert.match(bundleContent, /task-summary\.md/);
  const readmeContent = fs.readFileSync(packageReadme, 'utf8');
  assert.match(readmeContent, /Client \/ Team Handoff Package/);
  assert.match(readmeContent, /给客户 \/ 负责人/);
  assert.match(readmeContent, /bundle\/bundle\.md/);
  const packageIndexData = JSON.parse(fs.readFileSync(packageIndex, 'utf8'));
  assert.equal(packageIndexData.entrypoints.readme, 'README.md');
  assert.equal(packageIndexData.entrypoints.index, 'index.json');
  const manifest = JSON.parse(fs.readFileSync(manifestJson, 'utf8'));
  assert.equal(manifest.task_id, task.task_id);
  assert.equal(manifest.zip_root, task.task_id);
  assert.equal(manifest.entrypoints.readme, 'README.md');
  assert.equal(manifest.entrypoints.index, 'index.json');
  assert.equal(manifest.downloads.bundle_zip, `/api/tasks/${task.task_id}/download-bundle-zip`);
  assert.ok(Array.isArray(manifest.files));
  assert.ok(manifest.files.some((item) => item.relative_path === 'README.md'));
  assert.ok(manifest.files.some((item) => item.relative_path === 'index.json'));
  assert.ok(manifest.files.some((item) => item.relative_path === 'bundle/manifest.json'));
  assert.ok(manifest.files.every((item) => item.zip_path.startsWith(`${task.task_id}/`)));
  const zipBuffer = fs.readFileSync(bundleZip);
  assert.equal(zipBuffer.subarray(0, 4).toString('binary'), 'PK\u0003\u0004');
  const zipText = zipBuffer.toString('latin1');
  assert.match(zipText, new RegExp(`${task.task_id}/README\\.md`));
  assert.match(zipText, new RegExp(`${task.task_id}/index\\.json`));
  assert.match(zipText, new RegExp(`${task.task_id}/bundle/bundle\\.md`));
});

test('high-risk task escalates before approval', async () => {
  resetDataDir();
  const app = createApp();
  const task = await app.orchestrator.createAndRun('请帮我 deploy 这个系统到生产环境', { source: 'test' });
  assert.equal(task.status, 'escalated');
  assert.match(task.next_action, /Approval required|approve/i);
});

test('approved high-risk task can continue to closed', async () => {
  resetDataDir();
  const app = createApp();
  const initial = await app.orchestrator.createAndRun('deploy this system to production', { source: 'test' });
  assert.equal(initial.status, 'escalated');
  const approved = await app.orchestrator.approve(initial.task_id);
  assert.equal(approved.status, 'closed');
  assert.equal(approved.context.approved, true);
});

test('background consolidation creates run records', async () => {
  resetDataDir();
  const app = createApp();
  await app.orchestrator.createAndRun('写一个系统实现方案和测试计划', { source: 'test' });
  const run = app.backgroundWorker.runConsolidation();
  assert.equal(run.type, 'consolidation');
  assert.ok(run.learned_count >= 1);
  assert.ok(app.backgroundRunStore.list().length >= 1);
});

test('timeline and graph builders return task structure with dependency edges', async () => {
  resetDataDir();
  const app = createApp();
  const task = await app.orchestrator.createAndRun('设计多智能体系统，输出架构、接口、测试、实现计划、文档', { source: 'test' });
  const timeline = buildTaskTimeline(task, app.eventStore.list(task.task_id));
  const graph = buildTaskGraph(task, app.taskStore.list(), app.eventStore.list());
  assert.equal(timeline.task_id, task.task_id);
  assert.ok(timeline.checkpoints.length >= 3);
  assert.equal(graph.root_task_id, task.task_id);
  assert.ok(graph.nodes.length >= 1);
  assert.ok(graph.edges.some((edge) => edge.type === 'depends-on'));
  assert.ok(graph.queue.waves.length >= 2);
});

test('subtask execution plan builds waves from dependencies', async () => {
  resetDataDir();
  const app = createApp();
  const task = await app.orchestrator.createAndRun('输出架构、接口、测试、实现计划、文档', { source: 'test' });
  const plan = buildSubtaskExecutionPlan(task, app.taskStore.list());
  assert.equal(plan.status, 'ready');
  assert.ok(plan.waves.length >= 2);
  assert.ok(plan.waves[0].ready.some((item) => item.deliverable === 'architecture-outline'));
});

