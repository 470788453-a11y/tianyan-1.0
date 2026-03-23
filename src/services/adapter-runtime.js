import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from '../config.js';

const execFileAsync = promisify(execFile);

function buildInvocation(command, args = []) {
  if (process.platform === 'win32' && command === 'npm') {
    return {
      file: 'cmd.exe',
      args: ['/d', '/s', '/c', `npm ${args.join(' ')}`.trim()],
    };
  }

  return {
    file: command,
    args,
  };
}

function resolveTaskDir(taskId) {
  return path.join(config.generatedDir, taskId);
}

async function listFilesRecursive(dir, baseDir = dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...await listFilesRecursive(fullPath, baseDir));
      } else {
        files.push({
          fullPath,
          relativePath: path.relative(baseDir, fullPath).replaceAll('\\', '/'),
          name: entry.name,
        });
      }
    }

    return files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  } catch {
    return [];
  }
}

let crcTable;

function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c >>> 0;
  }
  return crcTable;
}

function crc32(buffer) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function toDosDateTime(dateInput = new Date()) {
  const date = new Date(dateInput);
  const safeYear = Math.max(1980, date.getFullYear() || 1980);
  const dosTime = ((date.getHours() & 0x1f) << 11)
    | ((date.getMinutes() & 0x3f) << 5)
    | (Math.floor(date.getSeconds() / 2) & 0x1f);
  const dosDate = (((safeYear - 1980) & 0x7f) << 9)
    | (((date.getMonth() + 1) & 0x0f) << 5)
    | (date.getDate() & 0x1f);
  return { dosTime, dosDate };
}

function buildZipArchive(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(String(entry.name).replaceAll('\\', '/'));
    const dataBuffer = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data || '');
    const { dosTime, dosDate } = toDosDateTime(entry.mtime);
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(dosTime, 12);
    centralHeader.writeUInt16LE(dosDate, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    localParts.push(localHeader, nameBuffer, dataBuffer);
    centralParts.push(centralHeader, nameBuffer);
    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectorySize = centralParts.reduce((sum, part) => sum + part.length, 0);
  const endRecord = Buffer.alloc(22);
  endRecord.writeUInt32LE(0x06054b50, 0);
  endRecord.writeUInt16LE(0, 4);
  endRecord.writeUInt16LE(0, 6);
  endRecord.writeUInt16LE(entries.length, 8);
  endRecord.writeUInt16LE(entries.length, 10);
  endRecord.writeUInt32LE(centralDirectorySize, 12);
  endRecord.writeUInt32LE(centralDirectoryOffset, 16);
  endRecord.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, ...centralParts, endRecord]);
}

function inferFileType(relativePath) {
  const ext = path.extname(relativePath).toLowerCase();
  if (ext === '.md') return 'markdown';
  if (ext === '.json') return 'json';
  if (ext === '.txt') return 'text';
  if (ext === '.zip') return 'zip';
  return ext ? ext.slice(1) : 'file';
}

function canPreviewFile(relativePath) {
  const ext = path.extname(relativePath).toLowerCase();
  return ['.md', '.json', '.txt'].includes(ext);
}

function buildTaskFileUrls(taskId, relativePath) {
  const encodedPath = encodeURIComponent(relativePath);
  return {
    preview_url: canPreviewFile(relativePath)
      ? `/api/tasks/${taskId}/file?path=${encodedPath}`
      : null,
    download_url: `/api/tasks/${taskId}/download-file?path=${encodedPath}`,
  };
}

function buildBundleReadme(task, stats) {
  return [
    `# ${config.projectDisplayName} Client / Team Handoff Package`,
    '',
    '这是一份可直接交付、可继续接手、也可被程序消费的任务交付包。',
    '',
    '## Delivery Summary',
    '',
    `- task_id: ${task.task_id}`,
    `- goal: ${task.goal}`,
    `- generated_at: ${stats.generatedAt}`,
    `- source_file_count: ${stats.sourceFileCount}`,
    `- markdown_count: ${stats.markdownCount}`,
    '',
    '## What Is Included',
    '',
    '- 任务摘要、架构、接口、测试方案、实施计划等结构化输出',
    '- 一份汇总后的完整 markdown 交付物',
    '- 一份适合程序读取的索引文件与完整 manifest',
    '',
    '## Quick Start',
    '',
    '1. 如果你是客户、负责人或第一次接手的人：先读本文件。',
    '2. 如果你想快速看最终成品：读 `bundle/bundle.md`。',
    '3. 如果你要继续开发或继续拆任务：按“任务摘要 -> 架构 -> 接口 -> 测试 -> 实施计划”的顺序阅读。',
    '4. 如果你要让程序或脚本消费这份包：读 `index.json` 与 `bundle/manifest.json`。',
    '',
    '## Package Entry Files',
    '',
    '- `README.md`：人类优先入口，适合客户交付 / 团队交接',
    '- `index.json`：机器优先入口，适合自动化工具 / 程序读取',
    '- `bundle/bundle.md`：汇总版 markdown 交付物',
    '- `bundle/manifest.json`：完整文件索引、下载入口、元数据',
    '',
    '## Recommended Reading Paths',
    '',
    '### 给客户 / 负责人',
    '- `task-summary.md`',
    '- `bundle/bundle.md`',
    '',
    '### 给产品 / 架构 / 研发接手人',
    '- `task-summary.md`',
    '- `architecture-outline.md`',
    '- `api-contract.md`',
    '- `test-strategy.md`',
    '- `implementation-plan.md`',
    '',
    '### 给自动化系统 / 二次处理脚本',
    '- `index.json`',
    '- `bundle/manifest.json`',
    '',
    '## Handoff Notes',
    '',
    '- `bundle/bundle.md` 适合一次性阅读和转发',
    '- `bundle/manifest.json` 适合精确定位单文件、下载入口和 zip 内路径',
    '- 如果后续继续演进，建议把新增交付物继续落在当前 task 包目录下，保持同一份交接结构',
  ].join('\n');
}

function buildBundleIndex(task, stats) {
  return {
    package_format: 'agentx-task-bundle',
    package_version: 1,
    task_id: task.task_id,
    goal: task.goal,
    generated_at: stats.generatedAt,
    project_slug: config.projectSlug,
    project_display_name: config.projectDisplayName,
    zip_root: task.task_id,
    entrypoints: {
      readme: 'README.md',
      index: 'index.json',
      bundle_markdown: 'bundle/bundle.md',
      manifest: 'bundle/manifest.json',
    },
    stats: {
      source_file_count: stats.sourceFileCount,
      markdown_count: stats.markdownCount,
    },
  };
}

async function buildFileDescriptor(taskId, relativePath, fullPath) {
  const stat = await fs.stat(fullPath);
  return {
    relative_path: relativePath,
    zip_path: `${taskId}/${relativePath}`,
    size_bytes: stat.size,
    updated_at: stat.mtime.toISOString(),
    type: inferFileType(relativePath),
    ...buildTaskFileUrls(taskId, relativePath),
    included_in_bundle: true,
  };
}

async function createBundleZip(taskId) {
  const dir = resolveTaskDir(taskId);
  const files = (await listFilesRecursive(dir))
    .filter((file) => file.relativePath !== 'bundle/bundle.zip');

  const entries = [];
  for (const file of files) {
    const [data, stat] = await Promise.all([
      fs.readFile(file.fullPath),
      fs.stat(file.fullPath),
    ]);
    entries.push({
      name: `${taskId}/${file.relativePath}`,
      data,
      mtime: stat.mtime,
    });
  }

  const zipBuffer = buildZipArchive(entries);
  const bundleDir = path.join(dir, 'bundle');
  await fs.mkdir(bundleDir, { recursive: true });
  const zipPath = path.join(bundleDir, 'bundle.zip');
  await fs.writeFile(zipPath, zipBuffer);
  return zipPath;
}

export class AdapterRuntime {
  constructor() {
    this.allowedCommands = new Set(['node', 'npm']);
  }

  async execute(action, ctx) {
    if (action.kind === 'write_artifact') {
      const artifact = action.artifact;
      const dir = resolveTaskDir(ctx.task.task_id);
      await fs.mkdir(dir, { recursive: true });
      const filePath = path.join(dir, `${artifact.type}.json`);
      await fs.writeFile(filePath, JSON.stringify(artifact, null, 2), 'utf8');
      return {
        kind: action.kind,
        success: true,
        risk: 'low',
        filePath,
        artifactType: artifact.type,
        stdout: '',
        stderr: '',
        exitCode: 0,
      };
    }

    if (action.kind === 'write_text_file') {
      const dir = resolveTaskDir(ctx.task.task_id);
      const relativePath = action.relativePath || 'output.txt';
      const filePath = path.join(dir, relativePath);
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, action.content || '', 'utf8');
      return {
        kind: action.kind,
        success: true,
        risk: 'low',
        filePath,
        stdout: '',
        stderr: '',
        exitCode: 0,
      };
    }

    if (action.kind === 'bundle_task_outputs') {
      const dir = resolveTaskDir(ctx.task.task_id);
      await fs.mkdir(dir, { recursive: true });
      const sourceFiles = (await listFilesRecursive(dir))
        .filter((file) => !['README.md', 'index.json', 'bundle/bundle.md', 'bundle/manifest.json', 'bundle/bundle.zip'].includes(file.relativePath));
      const markdownFiles = sourceFiles.filter((file) => file.relativePath.endsWith('.md') && !file.relativePath.startsWith('bundle/'));
      const sections = [];

      for (const file of markdownFiles) {
        const content = await fs.readFile(file.fullPath, 'utf8');
        sections.push(`\n---\n\n## ${file.relativePath}\n\n${content}`);
      }

      const bundleDir = path.join(dir, 'bundle');
      await fs.mkdir(bundleDir, { recursive: true });
      const bundlePath = path.join(bundleDir, 'bundle.md');
      const manifestPath = path.join(bundleDir, 'manifest.json');
      const readmePath = path.join(dir, 'README.md');
      const indexPath = path.join(dir, 'index.json');
      const generatedAt = new Date().toISOString();

      const bundleText = [
        `# ${config.projectDisplayName} Export Bundle`,
        '',
        `- task_id: ${ctx.task.task_id}`,
        `- goal: ${ctx.task.goal}`,
        `- source_file_count: ${sourceFiles.length}`,
        `- markdown_count: ${markdownFiles.length}`,
        ...sections,
      ].join('\n');

      await fs.writeFile(bundlePath, bundleText, 'utf8');

      const bundleReadme = buildBundleReadme(ctx.task, {
        generatedAt,
        sourceFileCount: sourceFiles.length,
        markdownCount: markdownFiles.length,
      });
      await fs.writeFile(readmePath, bundleReadme, 'utf8');

      const bundleIndex = buildBundleIndex(ctx.task, {
        generatedAt,
        sourceFileCount: sourceFiles.length,
        markdownCount: markdownFiles.length,
      });
      await fs.writeFile(indexPath, JSON.stringify(bundleIndex, null, 2), 'utf8');

      const fileEntries = [];
      for (const file of sourceFiles) {
        fileEntries.push(await buildFileDescriptor(ctx.task.task_id, file.relativePath, file.fullPath));
      }
      fileEntries.push(await buildFileDescriptor(ctx.task.task_id, 'README.md', readmePath));
      fileEntries.push(await buildFileDescriptor(ctx.task.task_id, 'index.json', indexPath));
      fileEntries.push(await buildFileDescriptor(ctx.task.task_id, 'bundle/bundle.md', bundlePath));

      const manifestEntry = {
        relative_path: 'bundle/manifest.json',
        zip_path: `${ctx.task.task_id}/bundle/manifest.json`,
        size_bytes: 0,
        updated_at: generatedAt,
        type: 'json',
        ...buildTaskFileUrls(ctx.task.task_id, 'bundle/manifest.json'),
        included_in_bundle: true,
      };
      fileEntries.push(manifestEntry);

      const manifest = {
        task_id: ctx.task.task_id,
        goal: ctx.task.goal,
        generated_at: generatedAt,
        project_slug: config.projectSlug,
        project_display_name: config.projectDisplayName,
        zip_root: ctx.task.task_id,
        stats: {
          source_file_count: sourceFiles.length,
          bundle_file_count: fileEntries.length,
          markdown_count: markdownFiles.length + 2,
          total_bytes: 0,
        },
        entrypoints: {
          readme: 'README.md',
          index: 'index.json',
          bundle_markdown: 'bundle/bundle.md',
          manifest: 'bundle/manifest.json',
        },
        downloads: {
          bundle_markdown: `/api/tasks/${ctx.task.task_id}/download-bundle`,
          bundle_zip: `/api/tasks/${ctx.task.task_id}/download-bundle-zip`,
          manifest: `/api/tasks/${ctx.task.task_id}/download-file?path=${encodeURIComponent('bundle/manifest.json')}`,
        },
        files: fileEntries,
      };

      let manifestText = '';
      for (let index = 0; index < 5; index += 1) {
        manifest.stats.total_bytes = fileEntries.reduce((sum, item) => sum + item.size_bytes, 0);
        manifestText = JSON.stringify(manifest, null, 2);
        const nextSize = Buffer.byteLength(manifestText, 'utf8');
        if (manifestEntry.size_bytes === nextSize) break;
        manifestEntry.size_bytes = nextSize;
      }

      manifest.stats.total_bytes = fileEntries.reduce((sum, item) => sum + item.size_bytes, 0);
      manifestText = JSON.stringify(manifest, null, 2);
      await fs.writeFile(manifestPath, manifestText, 'utf8');
      const bundleZipPath = await createBundleZip(ctx.task.task_id);

      return {
        kind: action.kind,
        success: true,
        risk: 'low',
        bundlePath,
        manifestPath,
        bundleZipPath,
        stdout: '',
        stderr: '',
        exitCode: 0,
      };
    }

    if (action.kind === 'run_command') {
      const command = action.command;
      if (!this.allowedCommands.has(command)) {
        return {
          kind: action.kind,
          success: false,
          risk: 'medium',
          command,
          args: action.args || [],
          stdout: '',
          stderr: `Command not allowed: ${command}`,
          exitCode: -1,
        };
      }

      try {
        const invocation = buildInvocation(command, action.args || []);
        const { stdout, stderr } = await execFileAsync(invocation.file, invocation.args, {
          cwd: ctx.cwd || config.projectRoot,
          windowsHide: true,
          timeout: action.timeoutMs || 10000,
        });
        return {
          kind: action.kind,
          success: true,
          risk: 'medium',
          command,
          args: action.args || [],
          stdout: String(stdout || '').trim(),
          stderr: String(stderr || '').trim(),
          exitCode: 0,
        };
      } catch (error) {
        return {
          kind: action.kind,
          success: false,
          risk: 'medium',
          command,
          args: action.args || [],
          stdout: String(error.stdout || '').trim(),
          stderr: String(error.stderr || error.message || '').trim(),
          exitCode: Number.isInteger(error.code) ? error.code : 1,
        };
      }
    }

    return {
      kind: action.kind,
      success: false,
      risk: 'low',
      stdout: '',
      stderr: `Unknown action kind: ${action.kind}`,
      exitCode: -1,
    };
  }
}
