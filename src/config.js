import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

export const config = {
  projectRoot,
  dataDir: path.join(projectRoot, '.data'),
  publicDir: path.join(projectRoot, 'public'),
  generatedDir: path.join(projectRoot, '.data', 'generated'),
  projectSlug: 'agentx-1.0',
  projectDisplayName: '天衍1.0',
  port: Number(process.env.PORT || 4317),
  maxSubtaskDepth: Number(process.env.MAX_SUBTASK_DEPTH || 1),
  autoRunSubtasks: process.env.AUTO_RUN_SUBTASKS !== 'false',
};

