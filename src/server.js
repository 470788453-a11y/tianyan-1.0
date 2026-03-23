import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { URL } from 'node:url';
import { createApp } from './app.js';
import { config } from './config.js';
import { buildSubtaskExecutionPlan } from './core/subtask-queue.js';
import { buildTaskGraph, buildTaskTimeline } from './core/task-graph.js';

const app = createApp();

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

function sendHtml(res, filePath) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(fs.readFileSync(filePath, 'utf8'));
}

function sendDownload(res, filePath, downloadName) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = ext === '.json'
    ? 'application/json; charset=utf-8'
    : ext === '.md' || ext === '.txt'
      ? 'text/plain; charset=utf-8'
      : ext === '.zip'
        ? 'application/zip'
        : 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${downloadName}"`,
  });
  res.end(fs.readFileSync(filePath));
}

function listFilesRecursive(dir, baseDir = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFilesRecursive(fullPath, baseDir));
    } else {
      const stat = fs.statSync(fullPath);
      files.push({
        name: entry.name,
        path: fullPath,
        relative_path: path.relative(baseDir, fullPath).replaceAll('\\', '/'),
        size: stat.size,
        updated_at: stat.mtime.toISOString(),
      });
    }
  }

  return files.sort((a, b) => a.relative_path.localeCompare(b.relative_path));
}

function safeResolveTaskFile(taskId, relativePath) {
  const root = path.resolve(config.generatedDir, taskId);
  const resolved = path.resolve(root, relativePath || '');
  if (!resolved.startsWith(root)) return null;
  return resolved;
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString('utf8');
  return text ? JSON.parse(text) : {};
}

function notFound(res) {
  sendJson(res, 404, { error: 'Not found' });
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    if (req.method === 'GET' && pathname === '/') {
      return sendHtml(res, path.join(config.publicDir, 'index.html'));
    }

    if (req.method === 'GET' && pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        project: config.projectSlug,
        display_name: config.projectDisplayName,
        time: new Date().toISOString(),
      });
    }

    if (req.method === 'GET' && pathname === '/api/tasks') {
      return sendJson(res, 200, { tasks: app.taskStore.list() });
    }

    if (req.method === 'POST' && pathname === '/api/tasks') {
      const body = await readBody(req);
      const task = await app.orchestrator.createAndRun(body.input, body.context || {});
      return sendJson(res, 201, { task });
    }

    const taskMatch = pathname.match(/^\/api\/tasks\/([^/]+)$/);
    if (req.method === 'GET' && taskMatch) {
      const task = app.taskStore.get(taskMatch[1]);
      if (!task) return notFound(res);
      const subtasks = app.taskStore.list().filter((item) => item.parent_task_id === task.task_id);
      return sendJson(res, 200, { task, subtasks });
    }

    const eventsMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/events$/);
    if (req.method === 'GET' && eventsMatch) {
      return sendJson(res, 200, { events: app.eventStore.list(eventsMatch[1]) });
    }

    const timelineMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/timeline$/);
    if (req.method === 'GET' && timelineMatch) {
      const task = app.taskStore.get(timelineMatch[1]);
      if (!task) return notFound(res);
      return sendJson(res, 200, { timeline: buildTaskTimeline(task, app.eventStore.list(task.task_id)) });
    }

    const graphMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/graph$/);
    if (req.method === 'GET' && graphMatch) {
      const task = app.taskStore.get(graphMatch[1]);
      if (!task) return notFound(res);
      return sendJson(res, 200, {
        graph: buildTaskGraph(task, app.taskStore.list(), app.eventStore.list()),
      });
    }

    const queueMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/queue$/);
    if (req.method === 'GET' && queueMatch) {
      const task = app.taskStore.get(queueMatch[1]);
      if (!task) return notFound(res);
      return sendJson(res, 200, {
        queue: buildSubtaskExecutionPlan(task, app.taskStore.list()),
      });
    }

    const filesMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/files$/);
    if (req.method === 'GET' && filesMatch) {
      const task = app.taskStore.get(filesMatch[1]);
      if (!task) return notFound(res);
      const dir = path.join(config.generatedDir, task.task_id);
      return sendJson(res, 200, { files: listFilesRecursive(dir) });
    }

    const fileMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/file$/);
    if (req.method === 'GET' && fileMatch) {
      const task = app.taskStore.get(fileMatch[1]);
      if (!task) return notFound(res);
      const relativePath = url.searchParams.get('path') || '';
      const resolved = safeResolveTaskFile(task.task_id, relativePath);
      if (!resolved || !fs.existsSync(resolved)) return notFound(res);
      const stat = fs.statSync(resolved);
      const content = fs.readFileSync(resolved, 'utf8');
      return sendJson(res, 200, {
        file: {
          relative_path: relativePath,
          size: stat.size,
          updated_at: stat.mtime.toISOString(),
          content,
        },
      });
    }

    const downloadFileMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/download-file$/);
    if (req.method === 'GET' && downloadFileMatch) {
      const task = app.taskStore.get(downloadFileMatch[1]);
      if (!task) return notFound(res);
      const relativePath = url.searchParams.get('path') || '';
      const resolved = safeResolveTaskFile(task.task_id, relativePath);
      if (!resolved || !fs.existsSync(resolved)) return notFound(res);
      return sendDownload(res, resolved, path.basename(resolved));
    }

    const downloadBundleMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/download-bundle$/);
    if (req.method === 'GET' && downloadBundleMatch) {
      const task = app.taskStore.get(downloadBundleMatch[1]);
      if (!task) return notFound(res);
      const resolved = safeResolveTaskFile(task.task_id, 'bundle/bundle.md');
      if (!resolved || !fs.existsSync(resolved)) return notFound(res);
      return sendDownload(res, resolved, `${task.task_id}-bundle.md`);
    }

    const downloadBundleZipMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/download-bundle-zip$/);
    if (req.method === 'GET' && downloadBundleZipMatch) {
      const task = app.taskStore.get(downloadBundleZipMatch[1]);
      if (!task) return notFound(res);
      const resolved = safeResolveTaskFile(task.task_id, 'bundle/bundle.zip');
      if (!resolved || !fs.existsSync(resolved)) return notFound(res);
      return sendDownload(res, resolved, `${task.task_id}-bundle.zip`);
    }

    const approveMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/approve$/);
    if (req.method === 'POST' && approveMatch) {
      const task = await app.orchestrator.approve(approveMatch[1]);
      return sendJson(res, 200, { task });
    }

    const retryMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/retry$/);
    if (req.method === 'POST' && retryMatch) {
      const task = await app.orchestrator.retry(retryMatch[1]);
      return sendJson(res, 200, { task });
    }

    const runSubtasksMatch = pathname.match(/^\/api\/tasks\/([^/]+)\/run-subtasks$/);
    if (req.method === 'POST' && runSubtasksMatch) {
      const results = await app.orchestrator.runSubtasks(runSubtasksMatch[1]);
      const task = app.taskStore.get(runSubtasksMatch[1]);
      return sendJson(res, 200, { task, results });
    }

    if (req.method === 'GET' && pathname === '/api/memory') {
      const query = url.searchParams.get('q') || '';
      const result = app.orchestrator.memoryService?.search?.(query) || { records: [] };
      return sendJson(res, 200, result);
    }

    if (req.method === 'GET' && pathname === '/api/background/runs') {
      return sendJson(res, 200, { runs: app.backgroundRunStore.list() });
    }

    if (req.method === 'POST' && pathname === '/api/background/run') {
      const run = app.backgroundWorker.runConsolidation();
      return sendJson(res, 201, { run });
    }

    return notFound(res);
  } catch (error) {
    return sendJson(res, 500, { error: error.message, stack: error.stack });
  }
});

server.listen(config.port, () => {
  console.log(`[${config.projectDisplayName}/${config.projectSlug}] listening on http://localhost:${config.port}`);
});
